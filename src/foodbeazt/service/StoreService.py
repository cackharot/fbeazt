from datetime import datetime
from bson import ObjectId
import re

class DuplicateStoreNameException(Exception):
  def __init__(self, message='Store name already exits'):
    Exception.__init__(self, message)


class StoreService(object):
  def __init__(self, db):
    self.db = db
    self.stores = self.db.store_collection
    self.weekday_names = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

  def search(self, tenant_id, filter_text=None, only_veg=False, only_open=False, page_no=1,page_size=10):
    query = {"tenant_id": ObjectId(tenant_id)}

    if filter_text is not None and len(filter_text) > 2:
      query['name'] = {'$regex': r".*%s.*" % filter_text, '$options': 'i'}

    if only_veg:
      query['food_type'] = {'$elemMatch': {'$eq': 'veg'}}

    if only_open:
      now = datetime.now()
      hrmin = float("%.2f" % ((now.hour + (now.minute/60))%12))
      day = self.weekday_names[now.weekday()]
      query['open_time'] = { "$lte": hrmin }
      query['close_time'] = { "$gte": hrmin }
      query['is_closed'] = { "$eq": False }
      query['holidays'] = {
        "$elemMatch":  {
          '$not': re.compile(day, re.IGNORECASE)
        }
      }

    offset = (page_no - 1) * page_size
    if offset < 0: offset = 0
    lst = self.stores.find(query)
    print(query)
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
    return [x for x in self.stores.find({ '_id': { '$in': [ObjectId(x) for x in store_ids] }})]
