from datetime import datetime
from bson import ObjectId


class DuplicateStoreNameException(Exception):
    pass


class StoreService(object):
    def __init__(self, db):
        self.db = db
        self.stores = self.db.store_collection

    def search(self):
        return [x for x in self.stores.find()]

    def save(self, store_item):
        if '_id' not in store_item or store_item['_id'] is None:
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

    def check_duplicate_name(self, name, id):
        query = {'name': name}
        if id:
            query['_id'] = {"$ne": ObjectId(id)}
        return self.stores.find(query).count() > 0
