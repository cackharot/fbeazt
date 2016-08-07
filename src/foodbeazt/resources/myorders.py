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

  def get(self):
    tenant_id = g.user.tenant_id
    user_id = g.user.id
    try:
      items = []
      total = 0
      if user_id is not None:
        items, total = self.service.search(tenant_id=tenant_id,user_id=user_id, latest_first=True)
      return {
        "status": "success",
        "total": total,
        "items": items
      }
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error while searching for your orders"}, 410
