from datetime import datetime
from bson import ObjectId


class SettingsService(object):

    def __init__(self, db):
        self.db = db
        self.settings = db.settings_collection
        self._id = ObjectId("5bbbaee7bacf833c1203d7b3")

    def save(self, item):
        item['_id'] = self._id
        item['created_at'] = datetime.now()
        item['status'] = True
        return self.settings.save(item)

    def get(self):
        return self.settings.find_one({'_id': self._id})
