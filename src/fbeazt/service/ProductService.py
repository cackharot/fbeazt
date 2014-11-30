from datetime import datetime
from bson import ObjectId
import re

class ProductService(object):
    def __init__(self, db):
        self.db = db
        self.products = db.product_collection

    def create(self, item):
        item.pop('_id', None)
        item['created_at'] = datetime.now()
        item['status'] = True
        return self.products.insert(item)

    def update(self, item):
        if item['_id'] is None:
            return
        item['updated_at'] = datetime.now()
        self.products.save(item)

    def get_by_id(self, _id):
        return self.products.find_one({'_id': ObjectId(_id)})

    def get_by_name(self, name):
        return [x for x in self.products.find({'name': name})]

    def search(self, tenant_id, store_id, page_no=1, page_size=16, category=None, filter_text=None):
        query = {}
        if tenant_id:
            query['tenant_id'] = ObjectId(tenant_id)
        if store_id:
            query['store_id'] = ObjectId(store_id)

        if filter_text and len(filter_text) > 2:
            query['name'] = re.compile(filter_text, re.IGNORECASE)

        if category and len(category) > 2:
            query['category'] = re.compile(category, re.IGNORECASE)

        skip_records = (page_no - 1) * page_size
        if skip_records < 0:
            skip_records = 0
        lst = self.products.find(query)
        return [x for x in lst.sort("created_at", -1).skip(skip_records).limit(page_size)], lst.count()

    def delete(self, _id):
        self.products.remove({'_id': ObjectId(_id)})