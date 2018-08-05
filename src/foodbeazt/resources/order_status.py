import time
from datetime import datetime
from collections import defaultdict
from flask import g, request
from flask_restful import Resource
from flask_mail import Message
from bson import ObjectId, json_util
from service.OrderService import OrderService
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from service.PushNotificationService import PushNotificationService
from service.SmsService import SmsService
from foodbeazt.fapp import mongo, app, mail, invoice_emails_folder
import logging
import os
import pdfkit

order_delivered_email_template = app.jinja_env.get_template('email/order_delivered.html')
order_invoice_pdf_template = app.jinja_env.get_template('email/order_invoice.html')
order_delivered_sms_template = app.jinja_env.get_template('sms/order_delivered.txt')


class OrderStatusApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeService = StoreService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.pushNotifyService = PushNotificationService(
            mongo.db, app.config['GCM_API_KEY'])
        self.smsService = SmsService(
            mongo.db, app.config['SMS_USER'], app.config['SMS_API_KEY'])

    def post(self, _id):
        if _id is None or len(_id) == 0:
            return {"status": "error", "message": "Invalid order id provided"}, 443

        try:
            data = json_util.loads(request.data.decode('utf-8'))
            status = data.get('status', None)
            notes = data.get('notes', None)
            if not self.is_valid_status(status):
                return {"status": "error", "message": "Invalid status provided"}, 443

            order = self.service.get_by_id(_id)

            if order is None:
                return {"status": "error", "messagee": "Invalid order id provided. Order not found"}, 443

            if order['status'] == 'DELIVERED':
                return {"status": "error", "message": "Order has been completed you cannot change anymore"}, 443

            if order['status'] == 'CANCELLED':
                return {"status": "error", "message": "Order has been cancelled you cannot change anymore"}, 443

            order['status'] = status
            if notes and len(notes) > 0:
                order['notes'] = notes

            self.service.save(order)
            self.log.info("Updating order #%s status to %s", order.get('order_no'), status)
            if status == 'DELIVERED':
                self.send_notification(order) # customer notification
            if status == 'PREPARING':
                self.notify_store_contact(order) # store admin notification

            return {'status': 'success', 'data': status}, 200
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error while finding the order"}, 444

    def is_valid_status(self, status):
        return status is not None and status in ['PENDING', 'PREPARING', 'PROGRESS', 'DELIVERED', 'INVALID', 'CANCELLED', 'PAID']

    def send_notification(self, order):
        self.generate_pdf_invoice(order)
        self.send_sms(order)
        self.send_email(order)

    def generate_pdf_invoice(self, order):
        try:
            html_text = order_invoice_pdf_template.render(order=order)
            output_filename = os.path.join(
                invoice_emails_folder, "Invoice-%s.pdf" % (order['order_no']))
            pdfkit.from_string(html_text, output_filename)
        except Exception as e:
            self.log.exception(e)

    def send_email(self, order):
        email = order['delivery_details']['email']
        subject = "Order Delivered <%s>" % (order['order_no'])
        msg = Message(subject=subject,
                      reply_to=app.config['MAIL_REPLY_TO'],
                      charset='utf-8',
                      sender=(app.config['MAIL_SENDER_NAME'],
                              app.config['MAIL_SENDER']),
                      recipients=[email])
        msg.html = order_delivered_email_template.render(order=order)

        self.log.info("Sending email [%s] to %s" % (subject, email))

        if app.config['SEND_MAIL'] is False:
            return

        try:
            invoice_filename = "Invoice-%s.pdf" % (order['order_no'])
            output_filename = os.path.join(
                invoice_emails_folder, invoice_filename)
            if os.path.isfile(output_filename):
                with app.open_resource(output_filename) as fp:
                    msg.attach(invoice_filename, "application/pdf", fp.read())
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

    def notify_store_contact(self, order):
        store_orders_grp = defaultdict(list)
        for item in order.get('items'):
            store_id = item.get('store_id')
            store_orders_grp[store_id].append(item)

        store_ids = store_orders_grp.keys()
        stores = {x['_id']: x for x in self.storeService.search_by_ids(store_ids=store_ids)}

        for store_id in store_orders_grp:
            store = stores[store_id]
            email = store.get('contact_email', None)
            if email is None:
                self.log.warn('Store %s does not have contact email', store.get('name'))
                continue
            items = store_orders_grp[store_id]
            order_id = order['_id']
            store_order = self.storeOrderService.get_by_order_id(store_id=store_id, order_id=order_id)
            if store_order is None:
                store_order = {
                        'tenant_id': order['tenant_id'],
                        'store_id': store_id,
                        'order_id': order_id,
                        'order_no': order['order_no'],
                        'status': 'PENDING',
                        'quantity': sum([x['quantity'] for x in items]),
                        'status_timings': dict(PENDING=datetime.now()),
                        'store_discount': store.get('given_discount', 5.0),
                        'items': items
                    }
                self.storeOrderService.save(store_order)
            sno = store_order['store_order_no']
            data = {
                'message': "%d items and %.2f quantity. Total Rs. %.2f" % (len(items), store_order['quantity'], store_order['total']),
                'store_order_no': sno,
                'store_order_id': str(store_order['_id']),
                'order_date': store_order['created_at'],
                'total_quantity': sum([x.get('quantity', 0) for x in items]),
                'title': "New Order #%s" % (sno)
            }
            self.log.info('Notifying Store %s for new order #%s - %s, email: %s', store.get('name'), order['order_no'], sno, email)
            self.pushNotifyService.send_to_device(data, email=email)

