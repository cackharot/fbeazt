from datetime import datetime
from bson import ObjectId

import re
import random
import string

import time
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
               latest_first=False):
        query = {"tenant_id": ObjectId(tenant_id)}
        if store_id:
            query['store_id'] = ObjectId(store_id)
        if order_no is not None and len(order_no) > 0:
            query['order_no'] = order_no
        if order_status is not None and len(order_status) > 0:
            query['status'] = {"$in": order_status.split(',')}
        else:
            query['status'] = {"$not": {"$in": ['DELIVERED', 'CANCELLED']}}
        if filter_text is not None and len(filter_text) > 0:
            search_val = re.compile(r".*%s.*" % (filter_text), re.IGNORECASE)
            query['store_order_no'] = search_val

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
            item['created_at'] = datetime.now()
            item['status'] = 'PENDING'
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

    def get_by_order_id(self, _id):
        return self.store_orders.find_one({'order_id': ObjectId(_id)})

    def get_by_number(self, order_no):
        return self.store_orders.find_one({"store_order_no": order_no})

    def get_order_total(self, order):
        return sum([x['total'] for x in order['items']])
