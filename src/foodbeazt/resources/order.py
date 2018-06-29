import time
from datetime import datetime
from bson import ObjectId, json_util
from collections import defaultdict
from flask import g, request
from flask_mail import Message
from flask_restful import Resource
from service.OrderService import OrderService, DuplicateOrderException
from service.PushNotificationService import PushNotificationService
from service.ProductService import ProductService
from service.PincodeService import PincodeService
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from service.SmsService import SmsService
from libs.order_helper import OrderHelper
from foodbeazt.fapp import mongo, app, mail
from resources.coupon import ValidateCouponApi
import logging

from gcm import *

order_created_template = app.jinja_env.get_template('email/order_created.html')
order_created_sms_template = app.jinja_env.get_template(
    'sms/order_created.txt')
order_otp_sms_template = app.jinja_env.get_template('sms/otp.txt')


class TrackOrderApi(Resource):

    def get(self, order_no):
        return OrderApi().get(order_no)


class OrderApi(Resource):

    def __init__(self):
        self.MAX_ORDER_PER_PHONE = 3
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)
        self.productService = ProductService(mongo.db)
        self.pincodeService = PincodeService(mongo.db)
        self.pushNotifyService = PushNotificationService(
            mongo.db, app.config['GCM_API_KEY'])
        self.smsService = SmsService(
            mongo.db, app.config['SMS_USER'], app.config['SMS_API_KEY'])
        self.helper = OrderHelper(self.productService)
        self.validateCouponService = ValidateCouponApi()

    def get(self, _id):
        if _id == "-1":
            return None, 404
        try:
            order = None
            if len(_id) <= 9:
                order = self.service.get_by_number(_id)
            else:
                order = self.service.get_by_id(_id)
            if order:
                store_ids = [str(x['store_id']) for x in order['items']]
                stores = self.storeService.search_by_ids(store_ids=store_ids)
                for item in order['items']:
                    item['store'] = next(
                        (x for x in stores if x['_id'] == item['store_id']), None)
                return order, 200
            else:
                return None, 404
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
            return dict(status="error", message="Error while sending OTP. Try again later!"), 400

    def verify_otp(self, data):
        order_id = data.get("order_id", None)
        otp = data.get("otp", None)
        if otp is None or len(otp) < 3 or len(otp) > 10:
            return dict(status='error', message="Invalid OTP given"), 424
        try:
            order = self.service.get_by_id(order_id)
            if order is None or order['status'] == 'DELIVERED':
                return dict(status='error', message="Invalid Order id given. Order not found/delivered"), 425

            number = order['delivery_details'].get('phone')
            if self.smsService.update_otp(number, otp):
                order['otp_status'] = 'VERIFIED'
                self.service.save(order)
                self.send_email(order)
                self.send_sms(order)
                self.notify_new_order(order)
                self.log.info(
                    "%s order success after OTP verified!", order.get('order_no'))
                return dict(status='success'), 200
            else:
                return dict(status='error', message="Invalid OTP given"), 424
        except Exception as e:
            self.log.exception(e)
            return dict(status="error", message="Unable to verify the OTP. Please try again later!"), 427

    def post(self, _id):
        order = json_util.loads(request.data.decode('utf-8'))
        self.log.debug("RECEIVED ORDER %s" % order)

        validation_error, sanitized_items = self.helper.validate_line_items(order)
        if validation_error is not None:
            return dict(status='error', type='validation', message=validation_error), 421

        delivery_validation, delivery_details = self.helper.validate_delivery_details(order)
        if delivery_validation is not None:
            return dict(status='error', type='validation', message=delivery_validation), 422

        payment_type = order.get('payment_type', 'cod')
        if payment_type not in ['cod', 'payumoney', 'paytm']:
            return dict(status='error', type='validation', message="Invalid Payment choosen"), 422

        tenant_id = g.user.tenant_id
        user_id = g.user.id
        valid_order = {
            'tenant_id': ObjectId(tenant_id),
            'user_id': ObjectId(user_id),
            'items': sanitized_items,
            'delivery_details': delivery_details,
            'payment_type': payment_type
        }

        valid_order['delivery_charges'] = self.service.get_delivery_charges(
            valid_order)
        valid_order['total'] = self.service.get_order_total(valid_order)

        coupon_code = order.get('coupon_code', None)
        coupon_discount = 0.0
        if coupon_code:
            coupon_data = self.validateCouponService.fetch_coupon_data(
                coupon_code)
            if coupon_data is None:
                return dict(status='error', type='validation', message="Invalid coupon data!"), 422
            if not self.validateCouponService.valid_coupon(coupon_data):
                return dict(status='error', type='validation', message="Coupon code was expired!"), 422

            coupon_discount = self.validateCouponService.calculate_discount(
                valid_order, coupon_data)
            if coupon_discount <= 0.0:
                self.log.info(
                    'Coupon code does not meet the conditions! %s', coupon_code)
                return {'status': 'error', 'type': 'validation', 'message': 'Coupon code does not meet the conditions!'}, 472

            valid_order['coupon_code'] = coupon_code
            valid_order['coupon_discount'] = -coupon_discount

        if payment_type in ['cod', 'paytm']:
            valid_order['payment_status'] = 'success'
        _id = None

        try:
            pincode = valid_order['delivery_details']['pincode']
            if not self.pincodeService.check_pincode(pincode):
                return {"status": "error", "message": "Delivery not available for %s pincode!" % (pincode)}, 422

            self.check_spam_order(valid_order)
            valid_order['otp_status'] = self.send_otp(valid_order)
            _id = self.service.save(valid_order)
        except DuplicateOrderException as e:
            self.log.exception(e)
            return dict(status="error", message="We identified frequent placement of order. \
              Please wait 15 minutes before placing any other order."), 429
        except Exception as e:
            self.log.exception(e)
            return dict(status="error",
                        message="Oops! Error while trying to save order details! Please try again later"), 420

        if valid_order['otp_status'] == 'VERIFIED' and payment_type in ['cod', 'paytm']:
            self.send_email(valid_order)
            self.send_sms(valid_order)
            self.notify_new_order(valid_order)

        try:
            self.notify_store_contact(valid_order)
        except Exception as e:
            self.log.exception(e)

        self.log.info("%s order success!", valid_order.get('order_no'))
        return {"status": "success", "location": "/api/order/" + str(_id), "data": valid_order}

    def notify_new_order(self, order):
        email = order['delivery_details']['email']
        address = order['delivery_details']['address']
        pincode = order['delivery_details']['pincode']
        total = order['total']
        data = {
            'message': "Yay! New order from %s for Rs.%.2f. Delivery to %s - %s" % (email, total, address, pincode),
            'order_id': order['_id'],
            'order_no': order['order_no'],
            'order_date': order['created_at'],
            'total': total,
            'title': 'New Order'
        }
        try:
            # self.pushNotifyService.send_to_device(data, email='foodbeazt@gmail.com')
            # self.pushNotifyService.send_to_device(data, email='baraneetharan87@gmail.com')
            # self.pushNotifyService.send_to_device(data, email='vimalprabha87@gmail.com')
            self.pushNotifyService.send_to_device(data, email='cackharot@gmail.com')
        except Exception as e:
            self.log.exception(e)

    def notify_store_contact(self, order):
        store_orders_grp = defaultdict(list)
        for item in order.get('items'):
            store_id = item.get('store_id')
            store_orders_grp[store_id].append(item)

        for store_id in store_orders_grp:
            items = store_orders_grp[store_id]
            store_order = {
                'tenant_id': order['tenant_id'],
                'store_id': store_id,
                'order_no': order['order_no'],
                'status': 'PENDING',
                'items': items
            }
            store = self.storeService.get_by_id(store_id)
            email = store.get('contact_email', None)
            sid = self.storeOrderService.save(store_order)
            if email is None:
                self.log.warn('Store %s does not have contact email', store.get('name'))
                continue
            data = {
                'message': "New order %s items" % (len(items)),
                'order_id': order['_id'],
                'order_no': order['order_no'],
                'order_date': order['created_at'],
                'total_quantity': sum([x.get('quantity', 0) for x in items]),
                'sid': str(sid),
                'title': 'New Order'
            }
            self.log.info('Notifying Store %s for new order %s, email: %s', store.get('name'), sid, email)
            self.pushNotifyService.send_to_device(data, email=email)

    def delete(self, _id):
        return None, 204

    def send_otp(self, order):
        if order['payment_type'] in ['cod', 'paytm']:
            return 'VERIFIED'
        if app.config['SEND_OTP'] is False:
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
        track_link = app.config['ORDER_TRACK_URL'] % (order['order_no'])
        message = order_created_sms_template.render(
            order=order, track_link=track_link)
        try:
            self.smsService.send(number, message)
        except Exception as e:
            self.log.exception(e)

    def send_email(self, order):
        email = order['delivery_details']['email']
        subject = "Order confirmation <%s>" % (order['order_no'])
        msg = Message(subject=subject,
                      reply_to=app.config['MAIL_REPLY_TO'],
                      charset='utf-8',
                      sender=(app.config['MAIL_SENDER_NAME'],
                              app.config['MAIL_SENDER']),
                      recipients=[email])
        msg.html = order_created_template.render(order=order)
        self.log.info("Sending email [%s] to %s" % (subject, email))

        if app.config['SEND_MAIL'] is False:
            return
        try:
            mail.send(msg)
        except Exception as e:
            self.log.exception(e)

    def check_spam_order(self, order):
        number = order['delivery_details']['phone']
        email = order['delivery_details']['email']
        order_count = self.smsService.get_order_count(
            number=number, email=email, minutes=15)
        if order_count > self.MAX_ORDER_PER_PHONE:
            raise DuplicateOrderException()
