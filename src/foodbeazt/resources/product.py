from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.ProductService import ProductService
from service.StoreService import StoreService, DuplicateStoreNameException
from foodbeazt.fapp import mongo, admin_permission
import logging


class ProductListApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = ProductService(mongo.db)
    self.storeService = StoreService(mongo.db)

  def get(self, store_id=None):
    tenant_id = g.user.tenant_id

    if store_id == '-1' or store_id == -1:
      store_id = None
      tenant_id = None

    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 24))
    only_veg = bool(request.args.get('only_veg', False))
    filter_text = request.args.get('filter_text', None)
    category = request.args.get('category', None)
    only_veg = request.args.get('only_veg', False)
    include_deactivated = admin_permission.can()

    try:
      items, total = self.service.search(tenant_id=tenant_id, store_id=store_id, page_no=page_no,
                                          page_size=page_size, category=category,
                                          only_veg=only_veg,
                                          filter_text=filter_text,
                                          include_deactivated=include_deactivated)
      if items and len(items) > 0:
        store_ids = [str(x['store_id']) for x in items]
        stores = self.storeService.search_by_ids(store_ids=store_ids)
        for item in items:
          item['store'] = next((x for x in stores if x['_id'] == item['store_id']), None)

      return {'items': items, 'total': total}
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to searching product details! Please try again later"), 480


class ProductActivateApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = ProductService(mongo.db)

  def put(self, store_id, _id):
    try:
      item = self.service.get_by_id(_id)
      if item is None or item['store_id'] != ObjectId(store_id):
        return None, 404
      item['status'] = True
      self.service.update(item)
      return item
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to activate product details! Please try again later"), 481


class ProductApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = ProductService(mongo.db)

  def get(self, store_id, _id):
    if _id == "-1": return {}
    try:
      return self.service.get_by_id(_id)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on get retaurant with id %s" % _id}, 481

  def put(self, store_id, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['store_id'] = ObjectId(store_id)
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      self.service.update(item)
      return {"status": "success", "data": item}
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to update product details! Please try again later"), 485

  def post(self, store_id, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['store_id'] = ObjectId(store_id)
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      _id = self.service.create(item)
      return {"status": "success", "location": "/api/product/" + str(store_id) + "/" + str(_id), "data": item}
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to create product details! Please try again later"), 485

  def delete(self, store_id, _id):
    try:
      item = self.service.get_by_id(_id)
      if item is None or item['store_id'] != ObjectId(store_id):
        return None, 404
      item['status'] = False
      self.service.update(item)
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to delete product details! Please try again later"), 485
    return None, 204
