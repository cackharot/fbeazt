import time
from bson import ObjectId, json_util
from flask import g, request
from flask_mail import Message
from flask_restful import Resource
from service.OrderService import OrderService, DuplicateOrderException
from service.ProductService import ProductService
from service.SmsService import SmsService
from foodbeazt.fapp import mongo, app, mail
import logging

order_created_template = app.jinja_env.get_template('email/order_created.html')
order_created_sms_template = app.jinja_env.get_template('sms/order_created.html')
order_otp_sms_template = app.jinja_env.get_template('sms/otp.html')

class TrackOrderApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)

  def get(self, order_no):
    if order_no is None or len(order_no) == 0:
      return {"status":"error","messag": "Invalid order number provided"}, 433

    try:
      item = self.service.get_by_number(order_no)
      return item, 200
    except Exception as e:
      self.log.exception(e)
      return {"status":"error","message":"Error while finding the order"}, 434

class OrderStatusApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)

  def post(self, _id):
    if _id is None or len(_id) == 0:
      return {"status":"error","messag": "Invalid order id provided"}, 443

    try:
      data = json_util.loads(request.data.decode('utf-8'))
      status = data.get('status', None)
      notes = data.get('notes', None)
      if status is None or not status in ['PENDING','PREPARING','PROGRESS','DELIVERED','INVALID','CANCELLED']:
        return {"status":"error","messag": "Invalid status provided"}, 443
      item = self.service.get_by_id(_id)
      if item is None or len(item.get('order_no','')) == 0:
        return {"status":"error","messag": "Invalid order id provided. Not found"}, 443
      item['status'] = status
      if notes is not None and len(notes) > 0:
        item['notes'] = notes
      self.service.save(item)
      return {"status":status,"notes": notes}, 200
    except Exception as e:
      self.log.exception(e)
      return {"status":"error","message":"Error while finding the order"}, 444

class OrderListApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
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
    order_no = request.args.get('order_no', None)

    try:
      items, total = self.service.search(tenant_id=tenant_id,
                            store_id=store_id,
                            page_no=page_no,
                            page_size=page_size,
                            filter_text=filter_text)
      return {'items': items, 'total': total}
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on searching orders"}, 420


class OrderApi(Resource):
  def __init__(self):
    self.MAX_ORDER_PER_PHONE = 3
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.productService = ProductService(mongo.db)
    self.smsService = SmsService(mongo.db, app.config['SMS_USER'], app.config['SMS_API_KEY'])

  def get(self, _id):
    if _id == "-1": return {}
    try:
      return self.service.get_by_id(_id)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on get order with id %s" % _id}, 421

  def put(self, _id):
    data = json_util.loads(request.data.decode('utf-8'))
    cmd = data.get('cmd', None)
    if cmd is None:
      return dict(status='error', message="Invalid command"), 423
    if cmd == "VERIFY_OTP":
      return self.verify_otp(data)
    elif cmd == "RESEND_OTP":
      return self.resend_otp(data)
    else:
      return dict(status='error', message="Invalid command"), 423

  def resend_otp(self, data):
    order_id = data.get("order_id", None)
    new_number = data.get("number", None)
    try:
      order = self.service.get_by_id(order_id)
      if order is None or order['status'] == 'DELIVERED':
        return dict(status='error', message="Invalid Order id given. Order not found/delivered"), 425
      if new_number is not None and len(new_number) != 0:
        if len(new_number) != 10:
          return dict(status='error', message="Invalid phone number!"), 426
        else:
          order['delivery_details']['phone'] = new_number
          self.service.save(order)
      order['otp_status'] = self.send_otp(order)
      self.service.save(order)
      return dict(status='success'), 200
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",message="Error while sending OTP. Try again later!"), 400

  def verify_otp(self, data):
    order_id = data.get("order_id", None)
    otp = data.get("otp", None)
    new_number = data.get("number", None)
    if otp is None or len(otp) < 3 or len(otp) > 10:
      return dict(status='error', message="Invalid OTP given"), 424
    order = self.service.get_by_id(order_id)
    if order is None or order['status'] == 'DELIVERED':
      return dict(status='error', message="Invalid Order id given. Order not found/delivered"), 425
    if new_number is not None and len(new_number) != 0:
      if len(new_number) != 10:
        return dict(status='error', message="Invalid phone number!"), 426
      else:
        order['delivery_details']['phone'] = new_number
        self.service.save(order)

    number = order['delivery_details'].get('phone')
    if self.smsService.update_otp(number, otp):
      order['otp_status'] = 'VERIFIED'
      self.service.save(order)
      self.send_email(order)
      self.send_sms(order)
      return dict(status='success'), 200
    else:
      return dict(status='error',message="Invalid OTP given"), 424

  def post(self, _id):
    order = json_util.loads(request.data.decode('utf-8'))
    self.log.debug("RECEIVED ORDER", order)
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

    _id = None
    try:
      valid_order['delivery_charges'] = self.service.get_delivery_charges(valid_order)
      valid_order['total'] = self.service.get_order_total(valid_order)
      self.check_duplicate_order(valid_order)
      valid_order['otp_status'] = self.send_otp(valid_order)
      _id = self.service.save(valid_order)
    except DuplicateOrderException as e:
      self.log.exception(e)
      return dict(status="error",message="We identified frequent placement of order. \
              Please wait 15 minutes before placing any other order."), 429
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to save order details! Please try again later"), 420

    if valid_order['otp_status'] == 'VERIFIED':
      self.send_email(valid_order)
      self.send_sms(valid_order)
    return {"status": "success", "location": "/api/order/" + str(_id), "data": valid_order}

  def delete(self, _id):
    item = self.service.get_by_id(_id)
    if item is None:
        return None, 404
    item['status'] = False
    self.service.delete(item)
    return None, 204

  def send_otp(self, order):
    if app.config['SEND_OTP'] == False:
      return 'VERIFIED'
    number = order['delivery_details'].get('phone')
    if not self.smsService.verified_number(number):
      otp = self.smsService.generate_otp()
      message = order_otp_sms_template.render(order=order, otp=otp)
      return self.smsService.send_otp(number, otp, message)
    else:
      return 'VERIFIED'

  def send_sms(self, order):
    number = order['delivery_details'].get('phone')
    track_link = "http://foodbeazt.in/track/%s" % (order['order_no'])
    message = order_created_sms_template.render(order=order,track_link=track_link)
    if app.config['SEND_SMS'] == False:
      self.log.info("DEV ** Sending SMS [%s] -> [%s]" % (number, message))
    else:
      try:
        self.smsService.send(number, message)
      except Exception as e:
        self.log.exception(e)

  def send_email(self, order):
    email = order['delivery_details'].get('email', None)
    if email is None or len(email) <= 3:
      return
    if app.config.get('MAIL_SENDER',None) is None:
      self.log.info("Invalid MAIL_SENDER configured. Not sending emails!!")
      return

    subject = "Order confirmation <%s>" % (order.get('order_no', '000'))
    msg = Message(subject,
                  sender=(app.config['MAIL_SENDER_NAME'], app.config['MAIL_SENDER']),
                  recipients=[email])
    msg.html = order_created_template.render(order=order)
    try:
      if app.config['SEND_MAIL'] == False:
        self.log.info("DEV ** Sending email [%s] to %s" % (subject, email))
        time.sleep(10)
      else:
        self.log.info("Sending email [%s] to %s" % (subject, email))
        mail.send(msg)
    except Exception as e:
      self.log.exception(e)

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

  def check_duplicate_order(self, order):
    phone = order['delivery_details']['phone']
    order_count = self.smsService.get_order_count(phone=phone,minutes=15)
    if order_count > self.MAX_ORDER_PER_PHONE:
      raise DuplicateOrderException()
