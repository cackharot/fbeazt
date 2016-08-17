from datetime import datetime
from bson import ObjectId

from .PincodeService import PincodeService

import re
import random
import string

class DuplicateOrderException(Exception):
  pass

class OrderService(object):
  def __init__(self, db):
    self.db = db
    self.pincodeService = PincodeService(db)
    self.orders = self.db.order_collection

  def search(self, tenant_id,
              user_id=None,
              store_id=None,
              page_no=1,
              page_size=25,
              order_no=None,
              order_status=None,
              filter_text=None,
              latest_first=False):
    query = {"tenant_id": ObjectId(tenant_id)}
    # if store_id:
    #   query['store_id'] = ObjectId(store_id)
    if user_id:
      query['user_id'] = ObjectId(user_id)
    query['otp_status'] = 'VERIFIED'
    if order_no is not None and len(order_no)>0:
      query['order_no'] = order_no
    if order_status is not None and len(order_status) > 0:
      query['status'] = {"$in": order_status.split(',')}
    else:
      query['status'] = {"$not": {"$in": ['DELIVERED', 'CANCELLED'] }}

    if filter_text is not None and len(filter_text)>0:
      search_val = re.compile(r".*%s.*"%(filter_text), re.IGNORECASE)
      query['$or'] = [
          {'order_no': search_val},
          {'delivery_details.name': search_val},
          {'delivery_details.phone': search_val}
      ]
    # print(query)
    skip_records = (page_no - 1) * page_size
    if skip_records < 0: skip_records = 0
    lst = self.orders.find(query)
    sort_dir = 1
    if latest_first: sort_dir = -1
    return [x for x in lst.sort("created_at", sort_dir).skip(skip_records).limit(page_size)], lst.count()

  def generate_order_no(self):
    cnt = 0
    no = None
    while no is None or cnt <= 10:
      no = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(9))
      cnt = cnt + 1
      if self.get_by_number(no) is not None:
        no = None
      else:
        break
    if no is None:
      raise Exception("Unabled to generate unique order no")
    return no

  def save(self, item):
    if '_id' not in item or item['_id'] is None or item['_id'] == "-1":
      item.pop('_id', None)
      item['delivery_charges'] = self.get_delivery_charges(item)
      item['total'] = self.get_order_total(item)
      item['created_at'] = datetime.now()
      item['status'] = 'PENDING'
      item['order_no'] = self.generate_order_no()
    else:
      item['updated_at'] = datetime.now()
      if item['status'] == 'DELIVERED':
        item['delivered_at'] = datetime.now()

    return self.orders.save(item)

  def delete(self, _id):
    item = self.orders.find_one({'_id': ObjectId(_id)})
    if item:
      self.orders.remove(item)
      return True
    return False

  def get_by_id(self, _id):
    return self.orders.find_one({'_id': ObjectId(_id)})

  def get_by_number(self, order_no):
    return self.orders.find_one({"order_no": order_no})

  def get_delivery_charges(self, order):
    store_count = len(self.get_unique_stores(order))
    if store_count <= 1:
      return 40
    return 40 + (25*(store_count-1))

  def get_unique_stores(self, order):
    store_ids = []
    for x in order['items']:
      sid = x['store_id']
      if not sid in store_ids:
        store_ids.append(sid)
    return store_ids

  def get_order_total(self, order):
    for x in order['items']:
      x['price'] = float(x['price'])
      x['quantity'] = float(x['quantity'])
    item_total = sum([x['price']*x['quantity'] for x in order['items']])
    return item_total + order['delivery_charges']

  def generate_report(self, tenant_id):
    total = self.orders.count()
    result = { 'total': total }
    data = self.orders.aggregate({'$group': { '_id': "$status", 'count': { "$sum": 1 }}})
    if data["ok"] == 1.0:
      for x in data["result"]:
        result[x['_id'].lower()] = x['count']
    return result
