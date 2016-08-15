import time
from bson import ObjectId, json_util
from flask import g, request
from flask_mail import Message
from flask_restful import Resource
from service.OrderService import OrderService, DuplicateOrderException
from service.ProductService import ProductService
from service.PincodeService import PincodeService
from service.StoreService import StoreService
from service.SmsService import SmsService
from foodbeazt.fapp import mongo, app, mail
import logging


class MyOrdersApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.storeService = StoreService(mongo.db)

  def get(self):
    tenant_id = g.user.tenant_id
    user_id = g.user.id
    try:
      page_no = int(request.args.get('page_no', 1))
      page_size = int(request.args.get('page_size', 10))
      orders = []
      total = 0
      if user_id is not None:
        orders, total = self.service.search(tenant_id=tenant_id,
                            page_no=page_no,
                            page_size=page_size,
                            user_id=user_id,
                            latest_first=True)

      self.update_item_store(orders)
      offset = page_no*page_size
      result = {'items': orders,
                'total': total,
                'page_no': page_no,
                'page_size': page_size,
                'status': 'success'}
      url = "/api/my_orders?page_no=%d&page_size=%d"
      if total > offset:
        result["next"] =  url % (page_no+1,page_size)
      if page_no > 1:
        result["previous"] = url % (page_no-1,page_size)
      return result
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error while searching for your orders"}, 410

  def update_item_store(self, orders):
    if orders is None or len(orders) == 0:
      return
    store_ids = []
    for order in orders:
      for item in order['items']:
        sid = str(item['store_id'])
        if sid not in store_ids:
          store_ids.append(sid)
    stores = self.storeService.search_by_ids(store_ids=store_ids)
    for order in orders:
      for item in order['items']:
        item['store'] = next((x for x in stores if x['_id'] == item['store_id']), None)
