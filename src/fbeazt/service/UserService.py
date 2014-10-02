from datetime import datetime
from bson import ObjectId


class DuplicateUserException(Exception):
    pass


class UserService(object):
    def __init__(self, db):
        self.db = db
        self.users = self.db.user_collection

    def create(self, item):
        if self.user_exists(item['email']):
            raise DuplicateUserException()

        item['created_at'] = datetime.now()
        item['status'] = True
        return self.users.insert(item)

    def get_by_email(self, email):
        return self.users.find_one({"email": email})

    def search(self):
        return [x for x in self.users.find()]

    def delete(self, id):
        return self.users.remove({"_id": ObjectId(id)})

    def get_by_id(self, id):
        return self.users.find_one({"_id": ObjectId(id)})

    def update(self, item):
        if item['_id'] is None:
            return item
        if self.user_exists(item['email'], str(item['_id'])):
            raise DuplicateUserException()

        item['updated_at'] = datetime.now()
        self.users.save(item)
        return item

    def user_exists(self, email, id=None):
        query = {}
        if id is not None:
            query = {"_id": {"$ne": ObjectId(id)}}
        query['email'] = email
        return self.users.find(query).count() > 0