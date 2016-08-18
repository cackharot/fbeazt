from flask import g, request
from flask_restful import Resource
from flask_mail import Message
from bson import ObjectId, json_util
from service.OrderService import OrderService
from service.SmsService import SmsService
from foodbeazt.fapp import mongo, app, mail
import logging

order_delivered_email_template = app.jinja_env.get_template('email/order_delivered.html')
order_delivered_sms_template = app.jinja_env.get_template('sms/order_delivered.txt')

class OrderStatusApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.smsService = SmsService(mongo.db, app.config['SMS_USER'], app.config['SMS_API_KEY'])

  def post(self, _id):
    if _id is None or len(_id) == 0:
      return {"status":"error","message": "Invalid order id provided"}, 443

    try:
      data = json_util.loads(request.data.decode('utf-8'))
      status = data.get('status', None)
      notes = data.get('notes', None)
      if not self.is_valid_status(status):
        return {"status":"error","message": "Invalid status provided"}, 443

      order = self.service.get_by_id(_id)

      if order is None:
        return {"status":"error","messagee": "Invalid order id provided. Order not found"}, 443

      if order['status'] == 'DELIVERED':
        return {"status":"error","message": "Order has been completed you cannot change anymore"}, 443

      order['status'] = status
      if notes is not None and len(notes) > 0:
        order['notes'] = notes

      self.service.save(order)

      if status == 'DELIVERED':
        self.send_notification(order)

      return None, 204
    except Exception as e:
      self.log.exception(e)
      return {"status":"error","message":"Error while finding the order"}, 444

  def is_valid_status(self,status):
    return status is not None and status in ['PENDING','PREPARING','PROGRESS','DELIVERED','INVALID','CANCELLED']

  def send_notification(self, order):
    self.send_sms(order)
    self.send_email(order)

  def send_email(self, order):
    email = order['delivery_details']['email']
    subject = "Order Delivered <%s>" % (order['order_no'])
    msg = Message(subject=subject,
                  reply_to=app.config['MAIL_REPLY_TO'],
                  charset='utf-8',
                  sender=(app.config['MAIL_SENDER_NAME'], app.config['MAIL_SENDER']),
                  recipients=[email])
    msg.html = order_delivered_email_template.render(order=order)

    self.log.info("Sending email [%s] to %s" % (subject, email))
    self.log.info(msg.html) ## remove this before commit

    if app.config['SEND_MAIL'] == False:
      return

    try:
      mail.send(msg)
    except Exception as e:
      self.log.exception(e)

  def send_sms(self, order):
    number = order.get('delivery_details').get('phone')
    message = order_delivered_sms_template.render(order=order)
    try:
      self.smsService.send(number, message, 'DELIVERED')
    except Exception as e:
      self.log.exception(e)