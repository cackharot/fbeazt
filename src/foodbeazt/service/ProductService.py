from datetime import datetime
from bson import ObjectId
import re


class ProductService(object):

    def __init__(self, db):
        self.db = db
        self.products = db.product_collection
        self.popular_items = db.popular_products_collections

    def create(self, item):
        if item.get('cuisines', None) is not None and isinstance(item['cuisines'], str):
            item['cuisines'] = item['cuisines'].split(',')
        item.pop('_id', None)
        item['created_at'] = datetime.now()
        item['status'] = True
        return self.products.insert(item)

    def update(self, item):
        if item.get('cuisines', None) is not None and isinstance(item['cuisines'], str):
            item['cuisines'] = item['cuisines'].split(',')
        if item['_id'] is None:
            return
        item['updated_at'] = datetime.now()
        self.products.save(item)

    def get_by_id(self, _id):
        return self.products.find_one({'_id': ObjectId(_id)})

    def get_by_name(self, name):
        return [x for x in self.products.find({'name': name})]

    def search(self, tenant_id, store_id,
               page_no=1, page_size=16,
               category=None, filter_text=None,
               only_veg=False, include_deactivated=False):
        query = {}
        if tenant_id and tenant_id != '-1':
            query['tenant_id'] = ObjectId(tenant_id)
        if store_id and store_id != '-1':
            query['store_id'] = ObjectId(store_id)

        if filter_text is not None and len(filter_text) > 2:
            name_fltr = {'$regex': r".*%s.*" % filter_text, '$options': 'i'}
            name_search = {'name': name_fltr}
            price_table_search = {'price_table': {'$elemMatch': {'description': name_fltr}}}
            query['$or'] = [name_search, price_table_search]

        if category is not None and len(category) > 2:
            query['category'] = {'$regex': r".*%s.*" % category, '$options': 'i'}

        if only_veg:
            query['food_type'] = {'$elemMatch': {'$eq': 'veg'}}

        if not include_deactivated:
            query['status'] = True

        offset = (page_no - 1) * page_size
        if offset < 0:
            offset = 0
        lst = self.products.find(query)
        return [x for x in lst.sort("barcode", 1).skip(offset).limit(page_size)], lst.count()

    def delete(self, _id):
        return self.products.remove({'_id': ObjectId(_id)})

    def add_popular_item(self, tenant_id, product_id):
        hf = self.popular_items.find_one({'product_id': ObjectId(product_id)})
        if hf is not None:
            return None
        item = {
            "product_id": ObjectId(product_id),
            "tenant_id": ObjectId(tenant_id),
            "no": self.popular_items.find().count()+1,
            "created_at": datetime.now()
        }
        return self.popular_items.save(item)

    def update_popular_item_no(self, _id, no):
        item = self.popular_items.find_one({'product_id': ObjectId(_id)})
        item['no'] = no
        self.popular_items.save(item)

    def delete_popular_item(self, tenant_id, product_id):
        query = {
            "product_id": ObjectId(product_id),
            "tenant_id": ObjectId(tenant_id),
        }
        return self.popular_items.remove(query)

    def get_popular_items(self, tenant_id):
        query = {
            "tenant_id": ObjectId(tenant_id),
        }
        lst = self.popular_items.find(query).sort('no', 1)
        kv = {}
        for x in lst:
            kv[x['product_id']] = x['no']
        product_ids = [x for x in kv.keys()]
        if len(product_ids) == 0:
            return []
        items = self.products.find({"_id": {"$in": product_ids}})
        popular = []
        for x in items:
            x['is_popular'] = True
            x['no'] = kv[x['_id']]
            popular.append(x)
        return popular
