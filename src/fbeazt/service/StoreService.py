from bson import ObjectId


class StoreService(object):
    def __init__(self, db):
        self.db = db
        self.stores = self.db.store_collection

    def search(self):
        return [x for x in self.stores.find()]

    def save(self, store_item):
        return self.stores.save(store_item)

    def delete(self, _id):
        item = self.stores.find_one({'_id': ObjectId(_id)})
        if item:
            self.stores.remove(item)
            return True
        return False
