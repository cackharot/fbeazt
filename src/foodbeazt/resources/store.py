from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreService, DuplicateStoreNameException
from foodbeazt.fapp import mongo


class StoreListApi(Resource):
  def __init__(self):
    self.service = StoreService(mongo.db)

  def get(self):
    tenant_id = g.user.tenant_id

    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 10))
    only_veg = bool(request.args.get('only_veg', False))
    filter_text = request.args.get('filter_text', None)
    user_pincode = request.args.get('user_pincode', None)
    user_location = request.args.get('user_location', None)

    lst, count = self.service.search(
        tenant_id=tenant_id,
        filter_text=filter_text,
        only_veg=only_veg,
        page_no=page_no,
        page_size=page_size)
    return lst


class StoreApi(Resource):
  def __init__(self):
    self.service = StoreService(mongo.db)

  def get(self, _id):
    if _id == "-1": return {}
    return self.service.get_by_id(_id)

  def put(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      self.service.save(item)
      return {"status": "success", "data": item}
    except DuplicateStoreNameException as e:
      print(e)
      return {"status": "error", "message": "Store name already exists."}
    except Exception as e:
      print(e)
      return dict(status="error",
                  message="Oops! Error while trying to save store details! Please try again later")

  def post(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      _id = self.service.save(item)
      return {"status": "success", "location": "/api/store/" + str(_id)}
    except DuplicateStoreNameException as e:
      print(e)
      return {"status": "error", "message": "Store name already exists."}
    except Exception as e:
      print(e)
      return dict(status="error",
                  message="Oops! Error while trying to save store details! Please try again later")

  def delete(self, _id):
    self.service.delete(_id)
    return None, 204
