from bson import ObjectId, json_util
from flask import g, request
from flask_mail import Message
from flask_restful import Resource
from service.OrderService import OrderService
from service.ProductService import ProductService
from foodbeazt import mongo, app, mail

order_created_template = app.jinja_env.get_template('order_created.html')


class OrderListApi(Resource):
  def __init__(self):
    self.service = OrderService(mongo.db)

  def get(self):
    tenant_id = g.user.tenant_id
    store_id = None
    if store_id == '-1' or store_id == -1:
        store_id = None
        tenant_id = None

    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 24))
    filter_text = request.args.get('filter_text', None)

    items, total = self.service.search(tenant_id=tenant_id, store_id=store_id, page_no=page_no,
                                        page_size=page_size,
                                        filter_text=filter_text)
    return {'items': items, 'total': total}


class OrderApi(Resource):
  def __init__(self):
    self.service = OrderService(mongo.db)
    self.productService = ProductService(mongo.db)

  def get(self, _id):
    if _id == "-1":
        return {}
    item = self.service.get_by_id(_id)
    return item

  def post(self, _id):
    order = json_util.loads(request.data.decode('utf-8'))
    # print("RECEIVED ORDER", order)
    tenant_id = g.user.tenant_id
    valid_order = {
      'tenant_id': ObjectId(tenant_id)
    }
    validation_error, sanitized_items = self.validate_line_items(order)

    if not validation_error is None:
      return dict(status='error', type='validation', message=validation_error), 421
    valid_order['items'] = sanitized_items

    delivery_validation, delivery_details = self.validate_delivery_details(order)
    if not delivery_validation is None:
      return dict(status='error', type='validation', message=delivery_validation), 422

    valid_order['delivery_details'] = delivery_details

    try:
      _id = self.service.save(valid_order)
      self.send_email(valid_order)
      return {"status": "success", "location": "/api/order/" + str(_id), "data": valid_order}
    except Exception as e:
      print("OrderService: ERROR ->")
      print(e)
      return dict(status="error",
                  message="Oops! Error while trying to save order details! Please try again later"), 420

  def delete(self, _id):
    item = self.service.get_by_id(_id)
    if item is None:
        return None, 404
    item['status'] = False
    self.service.delete(item)
    return None, 204

  def send_email(self, order):
    email = order['delivery_details'].get('email', None)
    if email is None or len(email) <= 3:
      return
    if app.config.get('MAIL_SENDER',None) is None:
      print("Invalid MAIL_SENDER configured. Not sending emails!!")
      return

    subject = "Order confirmation <%s>" % (order.get('order_no', '000'))
    msg = Message(subject,
                  sender=(app.config['MAIL_SENDER_NAME'], app.config['MAIL_SENDER']),
                  recipients=[email])
    msg.html = order_created_template.render(order=order)
    try:
      if app.config['SEND_MAIL'] == False:
        print("DEV ** Sending email [%s] to %s" % (subject, email))
        import time
        time.sleep(10)
      else:
        print("Sending email [%s] to %s" % (subject, email))
        mail.send(msg)
    except Exception as e:
      print(e)

  def validate_line_items(self, order):
    validation_error = None
    sanitized_items = []
    if not 'items' in order or len(order['items']) == 0:
        validation_error="Atleast one item is required to process the order"
    else:
      count = 1
      for item in order['items']:
        if item['product_id'] is None:
          validation_error = "Invalid product id"
          break
        else:
          if item['quantity'] is None or float(item['quantity']) <= 0.0:
            validation_error = "%(name)'s quantity should be atleast 1.0" % (item['name'])
            break
          else:
            product = self.productService.get_by_id(item['product_id'])
            if product is None:
              validation_error = "Product not found with id %s" % (item['product_id'])
              break
            elif product.get('status', True) == False:
                validation_error = "%s is currently unavailable" % (product['name'])
                break
            else:
              sanitized_items.append({
                'no': count,
                'product_id': product['_id'],
                'name': product['name'],
                'description': product.get('description', None),
                'price': product['sell_price'],
                'quantity': float(item['quantity']),
                'total': (float(item['quantity'])*float(product['sell_price'])),
                'category': product.get('category', None),
                'store_id': product['store_id']
              })
              count =  count + 1
      return validation_error, sanitized_items

  def validate_delivery_details(self, order):
    delivery_details = order.get('delivery_details',None)
    if delivery_details is None:
      return "Invalid delivery details", None
    if delivery_details.get('name',None) is None or len(delivery_details['name']) < 3 or len(delivery_details['name']) > 50:
      return "Invalid name", None
    if delivery_details.get('email',None) is None or len(delivery_details['email']) < 3or len(delivery_details['email']) > 200:
      return "Invalid email address", None
    if delivery_details.get('phone',None) is None or len(delivery_details['phone']) != 10:
      return "Invalid phone number", None
    if delivery_details.get('pincode',None) is None or len(delivery_details['pincode']) != 6:
      return "Invalid pincode", None
    if delivery_details.get('address',None) is None or len(delivery_details['address']) < 6 or len(delivery_details['address']) > 500:
      return "Invalid address", None
    return None, {
      'name': delivery_details['name'],
      'email': delivery_details['email'],
      'phone': delivery_details['phone'],
      'pincode': delivery_details['pincode'],
      'address': delivery_details['address'],
      'landmark': delivery_details.get('landmark',None),
      'city': 'Puducherry',
      'state': 'Puducherry',
      'country': 'India',
      'notes': delivery_details.get('notes', None)
    }