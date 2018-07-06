from datetime import datetime
from bson import ObjectId

import re
import random
import string


class PaymentService(object):

    def __init__(self, db):
        self.db = db
        self.orders = self.db.order_collection
        self.order_payments = self.db.order_payments_collection
        self.order_payments_webhook = self.db.order_payments_webhook_collection

    def report_by_month(self, tenant_id=None, year=0):
        match = {}
        if year > 0:
            match['year'] = year
        query = [
            {'$project': {'status': "$status", 'amount': "$amount",
                          'month': {'$month': "$created_at"}, 'year': {'$year': '$created_at'}}},
            {'$match': match},
            {'$group': {'count': {'$sum': 1}, 'total': {'$sum': '$amount'}, '_id': {
                'status': "$status", 'month': "$month", 'year': '$year'}}}
        ]
        data = self.order_payments.aggregate(query)
        result = {}
        if data["ok"] == 1.0:
            for x in data["result"]:
                key = x['_id']['status']
                if key not in result:
                    result[key] = {}
                result[key][x['_id']['month']] = {
                    'count': x['count'],
                    'status': x['_id']['status'],
                    'total': x['total'],
                    'year': x['_id']['year'],
                    'month': x['_id']['month']
                }
        return result

    def get_by_order_no(self, order_no):
        query = dict(order_no=order_no)
        lst = self.order_payments.find(query)
        if len(lst) == 1:
            return lst
        return None

    def search(self, tenant_id,
               user_id=None,
               store_id=None,
               page_no=1,
               page_size=25,
               order_no=None,
               filter_text=None,
               status=None,
               latest_first=False):
        # query = {"tenant_id": ObjectId(tenant_id)}
        query = {}
        # if store_id:
        #   query['store_id'] = ObjectId(store_id)
        if user_id:
            query['user_id'] = ObjectId(user_id)
        if order_no is not None and len(order_no) > 0:
            query['order_no'] = order_no
        if status is not None and len(status) > 0 and len(status.split(',')) > 0:
            query['status'] = {"$in": status.split(',')}

        skip_records = (page_no - 1) * page_size
        if skip_records < 0:
            skip_records = 0
        lst = self.order_payments.find(query)
        sort_dir = 1
        if latest_first:
            sort_dir = -1
        return [x for x in lst.sort("created_at", sort_dir).skip(skip_records).limit(page_size)], lst.count()

    def save(self, item):
        if '_id' not in item:
            item['created_at'] = datetime.now()
        else:
            item['updated_at'] = datetime.now()
        return self.order_payments.save(item)

    def save_webhook(self, item):
        if '_id' not in item:
            item['created_at'] = datetime.now()
        else:
            item['updated_at'] = datetime.now()
        return self.order_payments_webhook.save(item)
