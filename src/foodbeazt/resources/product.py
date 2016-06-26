from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.ProductService import ProductService
from foodbeazt import mongo


class ProductListApi(Resource):
  def __init__(self):
    self.service = ProductService(mongo.db)

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

    items, total = self.service.search(tenant_id=tenant_id, store_id=store_id, page_no=page_no,
                                        page_size=page_size, category=category,
                                        only_veg=only_veg,
                                        filter_text=filter_text)
    return {'items': items, 'total': total}


class ProductActivateApi(Resource):
  def __init__(self):
    self.service = ProductService(mongo.db)

  def put(self, store_id, _id):
    item = self.service.get_by_id(_id)
    if item['store_id'] == ObjectId(store_id):
      item['status'] = True
      self.service.update(item)
      return item
    return None, 404


class ProductApi(Resource):
  def __init__(self):
    self.service = ProductService(mongo.db)

  def get(self, store_id, _id):
    if _id == "-1":
        return {}
    return self.service.get_by_id(_id)

  def put(self, store_id, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['store_id'] = ObjectId(store_id)
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      self.service.update(item)
      return {"status": "success", "data": item}
    except Exception as e:
      print(e)
      return dict(status="error",
                  message="Oops! Error while trying to save product details! Please try again later")

  def post(self, store_id, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['store_id'] = ObjectId(store_id)
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      _id = self.service.create(item)
      return {"status": "success", "location": "/api/product/" + str(store_id) + "/" + str(_id), "data": item}
    except Exception as e:
      print(e)
      return dict(status="error",
                  message="Oops! Error while trying to save product details! Please try again later")

  def delete(self, store_id, _id):
    item = self.service.get_by_id(_id)
    if item is None:
        return None, 404
    item['status'] = False
    self.service.update(item)
    return None, 204