from datetime import datetime
import re
from bson import ObjectId

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")


class DuplicateEmailException(Exception):
    pass


class InvalidEmailFormatException(Exception):
    pass


class SubscriptionService(object):
    def __init__(self, db):
        self.db = db
        self.subscriptions = db.subscription_collection

    def add(self, item):
        email = item['email']
        if not EMAIL_REGEX.match(email):
            raise InvalidEmailFormatException()
        if self.is_email_exists(email):
            raise DuplicateEmailException()
        item['created_at'] = datetime.now()
        item['status'] = True
        return self.subscriptions.save(item)

    def is_email_exists(self, email):
        item = self.get_by_email(email)
        return item is not None

    def get_by_email(self, email):
        if not EMAIL_REGEX.match(email):
            raise InvalidEmailFormatException()
        item = self.subscriptions.find_one({'email': email})
        return item

    def search(self):
        return [x for x in self.subscriptions.find()]

    def delete_by_email(self,email):
        item = self.get_by_email(email)
        if item:
            self.subscriptions.remove(item)
            return True
        return False

    def delete_by_id(self,id):
        return self.subscriptions.remove({'_id': ObjectId(id)})
