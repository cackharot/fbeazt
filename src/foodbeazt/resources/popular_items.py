from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.ProductService import ProductService
from service.StoreService import StoreService, DuplicateStoreNameException
from foodbeazt.fapp import mongo
import logging

class PopularItemsApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = ProductService(mongo.db)
    self.storeService = StoreService(mongo.db)

  def get(self, _id):
    tenant_id = g.user.tenant_id
    try:
      lst = self.service.get_popular_items(tenant_id)
      return { "items": lst }
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on searching popular dishes"}, 460

  def post(self, _id):
    tenant_id = g.user.tenant_id
    if _id is None:
      return {"status": "error", "message": "Invalid product id"}, 460
    item = self.service.get_by_id(_id)
    if item is None:
      return {"status": "error", "message": "Invalid product id"}, 460
    try:
      popular_item_id = self.service.add_popular_item(tenant_id, _id)
      return {
        "status":"success",
        "location": "/api/popular_items/%s" % (str(popular_item_id)),
        "_id": str(popular_item_id)
      }
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on saving popular dishes"}, 460

  def delete(self, _id):
    tenant_id = g.user.tenant_id
    if _id is None:
      return {"status": "error", "message": "Invalid product id"}, 460
    item = self.service.get_by_id(_id)
    if item is None:
      return {"status": "error", "message": "Invalid product id"}, 460
    try:
      self.service.delete_popular_item(tenant_id, _id)
      return None, 204 # No content
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on deleting popular dishes"}, 460