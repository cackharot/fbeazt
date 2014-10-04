from datetime import datetime
from bson import ObjectId


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

    def search(self, tenant_id):
        query = {'tenant_id': ObjectId(tenant_id)}
        return [x for x in self.products.find(query)]

    def delete(self, _id):
        self.products.remove({'_id': ObjectId(_id)})