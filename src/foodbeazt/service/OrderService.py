from datetime import datetime
from bson import ObjectId

import random
import string

class DuplicateOrderException(Exception):
    pass

class OrderService(object):
    def __init__(self, db):
        self.db = db
        self.orders = self.db.order_collection

    def search(self, tenant_id, store_id=None, page_no=1,
               page_size=25,
               filter_text=None):
        query = {"tenant_id": ObjectId(tenant_id)}
        if store_id:
            query['store_id'] = ObjectId(store_id)

        skip_records = (page_no - 1) * page_size
        if skip_records < 0:
            skip_records = 0

        lst = self.orders.find(query)
        return [x for x in lst.sort("created_at", -1).skip(skip_records).limit(page_size)], lst.count()

    def generate_order_no(self):
        digits_f = "".join([random.choice(string.digits) for i in range(3)])
        chars = "".join([random.choice(string.ascii_uppercase) for i in range(3)])
        digits_l = "".join([random.choice(string.digits) for i in range(3)])
        return digits_f + '' + chars + '' + digits_l

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

        return self.orders.save(item)

    def delete(self, _id):
        item = self.orders.find_one({'_id': ObjectId(_id)})
        if item:
            self.orders.remove(item)
            return True
        return False

    def get_by_id(self, _id):
        return self.orders.find_one({'_id': ObjectId(_id)})

    def get_by_number(self, order_no):
        return self.orders.find_one({"order_no": order_no})

    def get_delivery_charges(self, order):
        return 40.0

    def get_order_total(self, order):
        item_total = sum([x['price']*x['quantity'] for x in order['items']])
        return item_total + order['delivery_charges']
