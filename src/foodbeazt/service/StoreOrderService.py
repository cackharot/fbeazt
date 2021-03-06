from datetime import datetime, time
from bson import ObjectId
from collections import defaultdict

import re
import random
import string

import logging


class StoreOrderService(object):

    def __init__(self, db):
        self.db = db
        self.store_orders = self.db.store_orders_collection

    def search(self, tenant_id,
               store_id,
               page_no=1,
               page_size=25,
               order_no=None,
               order_status=None,
               filter_text=None,
               only_today=False,
               start_date=None,
               end_date=None,
               latest_first=False):
        query = {"tenant_id": ObjectId(tenant_id)}
        if store_id:
            query['store_id'] = ObjectId(store_id)
        if order_no is not None and len(order_no) > 0:
            query['order_no'] = order_no
        if order_status is not None and len(order_status) > 0:
            st = order_status.split(',')
            if 'DELIVERED' in st:
                st.append('PAID')
                st.append('CANCELLED')
            query['status'] = {"$in": st}
        else:
            query['status'] = {"$not": {"$in": ['DELIVERED', 'PAID', 'CANCELLED']}}
        if filter_text is not None and len(filter_text) > 0:
            search_val = re.compile(r".*%s.*" % (filter_text), re.IGNORECASE)
            query['store_order_no'] = search_val

        if only_today:
            d = datetime.combine(datetime.now().date(), time.min)
            query['created_at'] = {"$gte": d, "$lte": datetime.now()}
        elif start_date is not None and end_date is not None:
            start_date = datetime.combine(start_date, time.min)
            end_date = datetime.combine(end_date, time.max)
            query['created_at'] = {"$gte": start_date, "$lte": end_date}

        skip_records = (page_no - 1) * page_size
        if skip_records < 0:
            skip_records = 0
        lst = self.store_orders.find(query)
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
            raise Exception("Unabled to generate unique store order no")
        return no

    def save(self, item):
        if '_id' not in item or item['_id'] is None or item['_id'] == "-1":
            item.pop('_id', None)
            item['total'] = self.get_order_total(item)
            item['payable'] = item['total'] - (item['total'] * item['store_discount'] / 100.0)
            item['created_at'] = datetime.now()
            item['store_order_no'] = self.generate_order_no()
        else:
            item['updated_at'] = datetime.now()
            if item['status'] == 'DELIVERED':
                item['delivered_at'] = datetime.now()

        self.store_orders.save(item)
        return item['store_order_no']

    def delete(self, _id):
        item = self.store_orders.find_one({'_id': ObjectId(_id)})
        if item:
            self.store_orders.remove(item)
            return True
        return False

    def get_by_id(self, _id, store_id):
        return self.store_orders.find_one({'_id': ObjectId(_id), 'store_id': ObjectId(store_id)})

    def get_by_order_id(self, store_id, order_id):
        return self.store_orders.find_one({'store_id': ObjectId(store_id), 'order_id': ObjectId(order_id)})

    def get_by_order_ids(self, order_ids):
        return [x for x in self.store_orders.find({'order_id': {'$in': [ObjectId(x) for x in order_ids]}})]

    def get_by_number(self, order_no):
        return self.store_orders.find_one({"store_order_no": order_no})

    def get_order_total(self, order):
        return sum([x['total'] for x in order['items']])

    def generate_report(self, tenant_id, store_id, start_date, end_date):
        match = {"store_id": ObjectId(store_id)}
        project = {
            'status': '$status',
            'store_id': '$store_id',
            'total': '$payable',
            'created_at': '$created_at'
        }
        group = {
            '_id': '$status',
            'count': {'$sum': 1},
            'total': {'$sum': '$total'}
        }

        if start_date is not None and end_date is not None:
            start_date = datetime.combine(start_date, time.min)
            end_date = datetime.combine(end_date, time.max)
            match['created_at'] = {"$gte": start_date, "$lte": end_date}

        result = defaultdict(int, pending=0, progress=0, delivered=0, paid=0, cancelled=0)
        amounts = defaultdict(int, pending=0, progress=0, delivered=0, paid=0, cancelled=0)

        query = [
            {'$project': project},
            {'$match': match},
            {'$group': group}
        ]
        data = self.store_orders.aggregate(query)
        if data["ok"] == 1.0:
            for x in data["result"]:
                status = x['_id'].lower()
                sa = amounts[status]
                result[status] = x['count']
                result['total'] = result['total'] + x['count']
                amounts[status] = sa + x['total']
        result['amounts'] = amounts
        return result

    def order_trend(self, tenant_id, store_id, start_date, end_date):
        result = {}
        match = {}
        if start_date is not None and end_date is not None:
            start_date = datetime.combine(start_date, time.min)
            end_date = datetime.combine(end_date, time.max)
            match['created_at'] = {"$gte": start_date, "$lte": end_date}
        query = [
            {'$project': {'status': "$status", 'created_at': '$created_at',
                          'month': {'$month': "$created_at"}, 'year': {'$year': '$created_at'}}},
            {'$match': match},
            {'$group': {'count': {'$sum': 1}, '_id': {
                'status': "$status", 'month': "$month", 'year': '$year'}}}
        ]
        data = self.store_orders.aggregate(query)
        if data["ok"] == 1.0:
            for x in data["result"]:
                status = x['_id']['status'].lower()
                if status not in result:
                    result[status] = {}
                result[status][x['_id']['month']] = x['count']
        return result
