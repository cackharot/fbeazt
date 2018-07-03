from datetime import datetime
from bson import ObjectId

from .PincodeService import PincodeService

import re
import random
import string

import time
import logging

timeLog = logging.getLogger(__name__)


def timeit(method):
    def timed(*args, **kw):
        ts = time.time()
        result = method(*args, **kw)
        te = time.time()
        timeLog.info('%r (%r, %r) %2.2f ms' % (method.__name__, args, kw, (te-ts)*1000))
        return result
    return timed


class DuplicateOrderException(Exception):
    pass


class OrderService(object):

    def __init__(self, db):
        self.db = db
        self.pincodeService = PincodeService(db)
        self.orders = self.db.order_collection

    @timeit
    def search(self, tenant_id,
               user_id=None,
               store_id=None,
               page_no=1,
               page_size=25,
               order_no=None,
               order_status=None,
               filter_text=None,
               latest_first=False):
        query = {"tenant_id": ObjectId(tenant_id)}
        # if store_id:
        #     query['items.store_id'] = ObjectId(store_id)
        if user_id:
            query['user_id'] = ObjectId(user_id)
        # query['otp_status'] = 'VERIFIED'
        if order_no is not None and len(order_no) > 0:
            query['order_no'] = order_no
        if order_status is not None and len(order_status) > 0:
            query['status'] = {"$in": order_status.split(',')}
        else:
            query['status'] = {"$not": {"$in": ['DELIVERED', 'CANCELLED']}}

        if filter_text is not None and len(filter_text) > 0:
            search_val = re.compile(r".*%s.*" % (filter_text), re.IGNORECASE)
            query['$or'] = [
                {'order_no': search_val},
                {'delivery_details.name': search_val},
                {'delivery_details.phone': search_val}
            ]
        # print(query)
        skip_records = (page_no - 1) * page_size
        if skip_records < 0:
            skip_records = 0
        lst = self.orders.find(query)
        sort_dir = 1
        if latest_first:
            sort_dir = -1
        return [x for x in lst.sort("created_at", sort_dir).skip(skip_records).limit(page_size)], lst.count()

    def generate_order_no(self):
        cnt = 0
        no = None
        while no is None or cnt <= 10:
            no = ''.join(random.SystemRandom().choice(
                string.ascii_uppercase + string.digits) for _ in range(9))
            cnt = cnt + 1
            if self.get_by_number(no) is not None:
                no = None
            else:
                break
        if no is None:
            raise Exception("Unabled to generate unique order no")
        return no

    def save(self, item):
        if '_id' not in item or item['_id'] is None or item['_id'] == "-1":
            item.pop('_id', None)
            item['delivery_charges'] = self.get_delivery_charges(item)
            item['total'] = self.get_order_total(item)
            item['created_at'] = datetime.now()
            item['status'] = 'PENDING'
            item['order_no'] = self.generate_order_no()
        else:
            item['updated_at'] = datetime.now()
            if item['status'] == 'DELIVERED':
                item['delivered_at'] = datetime.now()

        return self.orders.save(item)

    def delete(self, _id):
        item = self.orders.find_one({'_id': ObjectId(_id)})
        if item:
            self.orders.remove(item)
            return True
        return False

    @timeit
    def get_by_id(self, _id):
        return self.orders.find_one({'_id': ObjectId(_id)})

    @timeit
    def get_by_number(self, order_no):
        return self.orders.find_one({"order_no": order_no})

    def get_delivery_charges(self, order):
        store_count = len(self.get_unique_stores(order))
        pincode_rate = self.pincodeService.get_rate(order['delivery_details'].get('pincode', ''))
        if store_count <= 1:
            return pincode_rate
        return pincode_rate + (25 * (store_count - 1))

    def get_unique_stores(self, order):
        return set([x['store_id'] for x in order['items']])

    def get_order_total(self, order):
        # for x in order['items']:
        #   x['price'] = float(x['price'])
        #   x['quantity'] = float(x['quantity'])
        item_total = sum([x['total'] for x in order['items']])
        return item_total + order['delivery_charges'] + self.get_coupon_discount(order)

    def get_coupon_discount(self, order):
        return order.get('coupon_discount', 0.0)

    def generate_report(self, tenant_id, store_id, year, month):
        match = {}
        if year > 0:
            match['year'] = year
        result = {'total': 0, 'pending': 0,
                  'preparing': 0, 'cancelled': 0, 'delivered': 0}
        data = self.orders.aggregate([
            {'$project': {'status': "$status",
                          'month': {'$month': "$created_at"}, 'year': {'$year': '$created_at'}}},
            {'$match': match},
            {'$group': {'_id': "$status", 'count': {"$sum": 1}}}
        ])
        if data["ok"] == 1.0:
            for x in data["result"]:
                result[x['_id'].lower()] = x['count']
                result['total'] = result['total'] + x['count']
        return result

    def order_trend(self, tenant_id, store_id, year, month):
        result = {}
        match = {}
        if year > 0:
            match['year'] = year
        query = [
            {'$project': {'status': "$status",
                          'month': {'$month': "$created_at"}, 'year': {'$year': '$created_at'}}},
            {'$match': match},
            {'$group': {'count': {'$sum': 1}, '_id': {
                'status': "$status", 'month': "$month", 'year': '$year'}}}
        ]
        data = self.orders.aggregate(query)
        if data["ok"] == 1.0:
            for x in data["result"]:
                status = x['_id']['status'].lower()
                if status not in result:
                    result[status] = {}
                result[status][x['_id']['month']] = x['count']
        return result

    def revenue_trend(self, tenant_id, store_id, year, month):
        result = {}
        match = {}
        if year > 0:
            match['year'] = year
        data = self.orders.aggregate([
            {'$project': {'total': "$total", 'delivery_charges': "$delivery_charges",
                          'month': {'$month': "$created_at"}, 'year': {'$year': '$created_at'}}},
            {'$match': match},
            {'$group': {'_id': {'month': "$month"}, 'delivery_charges': {
                "$sum": "$delivery_charges"}, 'total': {"$sum": "$total"}}}
        ])
        if data["ok"] == 1.0:
            for x in data["result"]:
                result[x['_id']['month']] = {'total': x[
                    'total'], 'delivery_charges': x['delivery_charges']}
        return result

    def load_orders(self, tenant_id, year=None, month=None, store_id=None):
        query = {"tenant_id": ObjectId(tenant_id)}
        if store_id is not None:
            query['items.store_id'] = ObjectId(store_id)
        if month is not None and month >= 1 and month <= 12:
            start_date = datetime(year, month, 1)
            if month >= 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            query['created_at'] = {'$gte': start_date, '$lt': end_date}
        # print("=" * 80, query)
        data = [x for x in self.orders.find(query)]
        return data
