from datetime import datetime, timedelta
from bson import ObjectId
import re


class FrequentStoreReviewException(Exception):

    def __init__(self, message='Frequent review posting detected!'):
        Exception.__init__(self, message)


class DuplicateStoreNameException(Exception):

    def __init__(self, message='Store name already exits'):
        Exception.__init__(self, message)


class StoreReviewService(object):

    def __init__(self, db):
        self.db = db
        self.reviews = self.db.store_review_collection

    def search(self, tenant_id, store_id, page_no=1, page_size=10):
        query = {"tenant_id": ObjectId(tenant_id), "store_id": ObjectId(store_id), "status": True}
        offset = (page_no - 1) * page_size
        if offset < 0:
            offset = 0
        lst = self.reviews.find(query)
        return [x for x in lst.sort("created_at", -1).skip(offset).limit(page_size)], lst.count()

    def save(self, item):
        if '_id' not in item or item['_id'] is None or item['_id'] == "-1":
            item.pop('_id', None)
            item['created_at'] = datetime.now()
            item['status'] = True
        else:
            item['updated_at'] = datetime.now()

        if 'store_id' not in item or 'user' not in item or 'email' not in item['user']:
            raise Exception('Invalid review posted')

        if self.check_frequent_posting(item.get('store_id'), item.get('user').get('email')):
            raise FrequentStoreReviewException('Frequent posting detected')

        return self.reviews.save(item)

    def check_frequent_posting(self, store_id, email):
        past_fifteen_mins = datetime.now() - timedelta(minutes=15)
        query = self.reviews.find({'store_id': ObjectId(
            store_id), 'user.email': email, 'created_at': {'$gt': past_fifteen_mins}})
        res = [x for x in query]
        # print("^^" * 70, query, past_fifteen_mins, res, len(res), "#"*80)
        return len(res) > 1

    def get_by_email(self, store_id, email):
        return self.reviews.find({'store_id': ObjectId(store_id), 'user.email': email})

    def delete(self, _id):
        item = self.reviews.find_one({'_id': ObjectId(_id)})
        if item:
            self.reviews.remove(item)
            return True
        return False

    def get_by_id(self, _id):
        return self.reviews.find_one({'_id': ObjectId(_id)})


class StoreService(object):

    def __init__(self, db):
        self.db = db
        self.stores = self.db.store_collection
        self.popular_items = db.popular_stores_collections
        self.weekday_names = ['monday', 'tuesday', 'wednesday',
                              'thursday', 'friday', 'saturday', 'sunday']

    def search(self, tenant_id, filter_text=None, only_veg=False,
               only_open=False, page_no=1, page_size=10,
               include_deactivated=False,
               cuisines=None, only_new=False):
        query = {"tenant_id": ObjectId(tenant_id)}

        if filter_text is not None and len(filter_text) > 2:
            query['$or'] = [
                {'name': {'$regex': r".*%s.*" % filter_text, '$options': 'i'}},
                {'cuisines': {'$regex': r".*%s.*" % filter_text, '$options': 'i'}}
            ]

        if cuisines is not None and len([x for x in cuisines if len(x.strip()) > 0]) > 0:
            cs = []
            for cus in cuisines:
                cs.append(
                    {
                        'cuisines': {
                            '$elemMatch': {'$regex': r".*%s.*" % cus.strip(), '$options': 'i'}
                        }
                    })
            query['$and'] = cs

        if only_veg:
            query['food_type'] = {'$elemMatch': {'$eq': 'veg'}}

        if only_new:
            query['created_at'] = {'$gte': datetime.now() - timedelta(days=90)}

        if only_open:
            now = datetime.now()
            hour = now.hour
            open_time = float("%.2f" % ((hour + (now.minute / 60))))
            close_time = open_time % 12

            day = self.weekday_names[now.weekday()]
            query['open_time'] = {"$lte": open_time}
            query['close_time'] = {"$gte": close_time}
            query['is_closed'] = {"$eq": False}
            query['holidays'] = {
                "$elemMatch": {
                    '$not': re.compile(day, re.IGNORECASE)
                }
            }
        if not include_deactivated:
            query['status'] = True
        # print(query)
        offset = (page_no - 1) * page_size
        if offset < 0:
            offset = 0
        lst = self.stores.find(query)
        return [x for x in lst.sort("created_at", -1).skip(offset).limit(page_size)], lst.count()

    def save(self, store_item):
        if store_item.get('cuisines', None) is not None and isinstance(store_item['cuisines'], str):
            store_item['cuisines'] = store_item['cuisines'].split(',')

        if '_id' not in store_item or store_item['_id'] is None or store_item['_id'] == "-1":
            store_item.pop('_id', None)
            store_item['created_at'] = datetime.now()
            store_item['status'] = True
        else:
            store_item['updated_at'] = datetime.now()

        if self.check_duplicate_name(store_item['name'], store_item.get('_id', None)):
            raise DuplicateStoreNameException()

        return self.stores.save(store_item)

    def get_by_name(self, name):
        return self.stores.find_one({'name': name})

    def delete(self, _id):
        item = self.stores.find_one({'_id': ObjectId(_id)})
        if item:
            self.stores.remove(item)
            return True
        return False

    def check_duplicate_name(self, name, _id):
        query = {'name': name}
        if _id:
            query['_id'] = {"$ne": ObjectId(_id)}
        return self.stores.find(query).count() > 0

    def get_by_id(self, _id):
        return self.stores.find_one({'_id': ObjectId(_id)})

    def search_by_ids(self, store_ids):
        return [x for x in self.stores.find({'_id': {'$in': [ObjectId(x) for x in store_ids]}})]

    def add_popular_item(self, tenant_id, store_id):
        hf = self.popular_items.find_one({'store_id': ObjectId(store_id)})
        if hf is not None:
            return None
        item = {
            "store_id": ObjectId(store_id),
            "tenant_id": ObjectId(tenant_id),
            "no": self.popular_items.find().count() + 1,
            "created_at": datetime.now()
        }
        return self.popular_items.save(item)

    def update_popular_item_no(self, _id, no):
        item = self.popular_items.find_one({'store_id': ObjectId(_id)})
        item['no'] = no
        item['updated_at'] = datetime.now()
        self.popular_items.save(item)

    def delete_popular_item(self, tenant_id, store_id):
        query = {
            "store_id": ObjectId(store_id),
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
            kv[x['store_id']] = x['no']
        store_ids = [x for x in kv.keys()]
        if len(store_ids) == 0:
            return []
        items = self.stores.find({"_id": {"$in": store_ids}})
        popular = []
        for x in items:
            x['is_popular'] = True
            x['no'] = kv[x['_id']]
            popular.append(x)
        return popular

    def get_cuisines(self, tenant_id):
        query = {'tenant_id': ObjectId(tenant_id)}
        items = self.stores.find(query, {'cuisines': 1, '_id': 0})
        result = set([y.strip().capitalize() for x in items if len(x.get('cuisines')) > 0
                      for y in x['cuisines']])
        return [x for x in result]
