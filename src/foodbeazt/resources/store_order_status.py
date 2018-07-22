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
from datetime import datetime
import logging
import os


class StoreOrderStatusApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeService = StoreService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.pushNotifyService = PushNotificationService(
            mongo.db, app.config['GCM_API_KEY'])

    def post(self):
        try:
            data = json_util.loads(request.data.decode('utf-8'))
            store_id = data.get('store_id', None)
            store_order_id = data.get('store_order_id', None)
            status = data.get('status', None)
            notes = data.get('notes', None)

            if store_id is None or len(store_id) == 0:
                return {"status": "error", "message": "Invalid store id provided"}, 443
            if store_order_id is None or len(store_order_id) == 0:
                return {"status": "error", "message": "Invalid store order id provided"}, 443
            if not self.is_valid_status(status):
                return {"status": "error", "message": "Invalid status provided"}, 443

            store = self.storeService.get_by_id(store_id)
            if not store:
                return {"status": "error", "messagee": "Invalid store id provided. Store not found"}, 443

            store_order = self.storeOrderService.get_by_id(store_order_id, store_id)
            if store_order is None:
                return {"status": "error", "messagee": "Invalid store order id provided. Order not found"}, 443
            if store_order['status'] == 'DELIVERED':
                return {"status": "error", "message": "Order has already been picked up by foodbeazt, you cannot change anymore"}, 443
            if store_order['status'] == 'PAID':
                return {"status": "error", "message": "Order has been paid you cannot change anymore"}, 443
            if store_order['status'] == 'CANCELLED':
                return {"status": "error", "message": "Order has been cancelled you cannot change anymore"}, 443

            order = self.service.get_by_id(store_order['order_id'])
            if order is None:
                return {"status": "error", "messagee": "Invalid order id provided. Order not found"}, 443

            store_order['status'] = status
            status_timings = store_order.get('status_timings', {})
            status_timings[status] = datetime.now()
            store_order['status_timings'] = status_timings
            if notes and len(notes) > 0:
                store_order['notes'] = notes
            self.log.info("Updating store order #%s to %s" % (store_order_id, status))
            self.storeOrderService.save(store_order)
            self.send_foodbeazt_notification(store, order, status, notes)

            return {'status': 'success', 'store_order_id': store_order_id, 'data': status}, 200
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error while finding the order"}, 444

    def is_valid_status(self, status):
        return status is not None and status in ['PENDING', 'PREPARING', 'PROGRESS', 'DELIVERED', 'INVALID', 'CANCELLED', 'PAID']

    def send_foodbeazt_notification(self, store, order, status, notes):
        address = order['delivery_details']['address']
        pincode = order['delivery_details']['pincode']
        data = {
            'message': "Store %s - %s [#%s at %s - %s]" % (store['name'], status, order['order_no'], address, pincode),
            'status': status,
            'notes': notes,
            'order_id': order['_id'],
            'store_id': store['_id'],
            'order_no': order['order_no'],
            'order_date': order['created_at'],
            'total': order['total'],
            'title': 'Store Update'
        }
        try:
            # self.pushNotifyService.send_to_device(data, email='foodbeazt@gmail.com')
            # self.pushNotifyService.send_to_device(data, email='baraneetharan87@gmail.com')
            # self.pushNotifyService.send_to_device(data, email='vimalprabha87@gmail.com')
            self.pushNotifyService.send_to_device(data, email='cackharot@gmail.com')
        except Exception as e:
            self.log.exception(e)
