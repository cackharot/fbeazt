from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.OrderService import OrderService
from service.PincodeService import PincodeService
from service.StoreService import StoreService
from foodbeazt.fapp import mongo
import logging


class ReportApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.pincodeService = PincodeService(mongo.db)
        self.storeService = StoreService(mongo.db)
        self.report_map = {
            'grand_total': self.service.generate_report,
            'order_trend': self.service.order_trend,
            'revenue_trend': self.service.revenue_trend,
            'load_orders': self.load_orders
        }

    def get(self):
        report_type = request.args.get('report_type', 'grand_total')
        if report_type in self.report_map:
            return self.exec_report(report_type)
        return []

    def exec_report(self, report_type):
        result = {}
        try:
            tenant_id = g.user.tenant_id
            result = self.report_map[report_type](tenant_id)
        except Exception as e:
            self.log.exception(e)
        return result

    def load_orders(self, tenant_id):
        store_id = request.args.get('store_id', None)
        month = request.args.get('month', None)
        if month is not None:
            month = int(month)
        orders = self.service.load_orders(
            tenant_id=tenant_id, store_id=store_id, month=month)
        store_ids = set([x['store_id'] for order in orders
                         for x in order['items']])
        stores = self.storeService.search_by_ids(store_ids=store_ids)
        pincodes = self.pincodeService.search(tenant_id)
        processed_orders = []
        for order in orders:
            osids = set([x['store_id'] for x in order['items']])
            store_cnt = 1
            for sid in osids:
                if store_id is not None and str(store_id) != str(sid):
                    continue
                pincode = order['delivery_details']['pincode']
                data = self.process_order_for_report(order, sid)
                data['delivery_charges'] = self.cal_delivery_charges(
                    order, store_cnt)
                data['store_name'] = next(
                    (x['name'] for x in stores if x['_id'] == sid), sid)
                data['store_discount'] = next(
                    (x.get('given_discount', 5) for x in stores if x['_id'] == sid), 5)
                data['delivery_location'] = next(
                    (x['area'] for x in pincodes if x['pincode'] == pincode), pincode)
                if data['status'] != 'DELIVERED':
                    data['net_amt'] = 0.0
                else:
                    data['net_amt'] = data['sub_total'] - \
                        (data['sub_total'] * data['store_discount'] / 100.0)
                processed_orders.append(data)
                store_cnt = store_cnt + 1
            totals = {
                'items_count': sum([x['items_count'] for x in processed_orders if x['status'] == 'DELIVERED']),
                'sub_total': sum([x['sub_total'] for x in processed_orders]),
                'net_amt': sum([x['net_amt'] for x in processed_orders]),
                'delivery_charges': sum([x['delivery_charges'] for x in processed_orders]),
            }
        return {"orders": processed_orders, "totals": totals}

    def process_order_for_report(self, order, sid):
        data = {'order_no': order['order_no'], 'created_at': order['created_at'],
                'payment_type': order.get('payment_type', 'cod'),
                'delivered_at': order.get('delivered_at'),
                'payment_status': order.get('payment_status', 'SUCCESS'),
                'total': order['total'], 'status': order['status']}
        data['items_count'], data[
            'sub_total'] = self.get_item_total(order, sid)
        return data

    def get_item_total(self, order, sid):
        items = [x for x in order['items'] if x['store_id'] == sid]
        total = sum([self.cal_price(x) for x in items])
        return len(items), total

    def cal_price(self, item):
        price = float(item['price'])
        qty = float(item['quantity'])
        discount = float(item.get('discount', 0.0))
        total = price * qty
        return total - (total * discount / 100.0)

    def cal_delivery_charges(self, order, store_cnt):
        if order['status'] != 'DELIVERED':
            return 0.0
        if store_cnt == 1:
            return 40.0
        return 25.0
