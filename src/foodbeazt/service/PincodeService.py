from datetime import datetime, timedelta
from bson import ObjectId
import re
import random
import string
import logging


class DuplicatePincodeException(Exception):

    def __init__(self):
        pass


class PincodeService(object):

    def __init__(self, db):
        self.log = logging.getLogger(__name__)
        self.pincodes = db.pincode_collection

    def get(self, tenant_id, _id):
        return self.pincodes.find_one({"tenant_id": ObjectId(tenant_id), "_id": ObjectId(_id)})

    def search(self, tenant_id):
        lst = self.pincodes.find({"tenant_id": ObjectId(tenant_id)})
        return [x for x in lst]

    def get_rate(self, pincode):
        if pincode is None or len(pincode) == 0:
            return 40.0
        item = self.pincodes.find_one({"pincode": pincode})
        if not item:
            return 40.0
        return float(item['rate'])

    def check_pincode(self, pincode):
        return self.pincodes.find({"pincode": pincode}).count() > 0

    def check_duplicate_pincode(self, _id, pincode):
        return self.pincodes.find({"_id": {"$not": {"$eq": ObjectId(_id)}}, "pincode": pincode}).count() > 0

    def save(self, item):
        _id = item.get("_id", None)
        if _id is not None and self.check_duplicate_pincode(_id, item.get("pincode")):
            raise DuplicatePincodeException()

        if item.get('status', None) is None:
            item['status'] = True

        if _id is None:
            item['created_at'] = datetime.now()
        else:
            item['updated_at'] = datetime.now()

        return self.pincodes.save(item)

    def delete(self, _id):
        return self.pincodes.remove({"_id": ObjectId(_id)})
