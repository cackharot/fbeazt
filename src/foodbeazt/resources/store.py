from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreService, DuplicateStoreNameException
from foodbeazt.fapp import mongo
import logging


class StoreListApi(Resource):
  def __init__(self):
    self.service = StoreService(mongo.db)
    self.log = logging.getLogger(__name__)

  def get(self):
    tenant_id = g.user.tenant_id

    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 10))
    only_veg = request.args.get('only_veg', None) in ["true", "True", "1"]
    only_open = request.args.get('only_open', None) in ["true", "True", "1"]
    filter_text = request.args.get('filter_text', None)
    user_pincode = request.args.get('user_pincode', None)
    user_location = request.args.get('user_location', None)

    try:
      lst, count = self.service.search(
          tenant_id=tenant_id,
          filter_text=filter_text,
          only_veg=only_veg,
          only_open=only_open,
          page_no=page_no,
          page_size=page_size)
      return lst
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on searching retaurants"}, 460


class StoreApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = StoreService(mongo.db)

  def get(self, _id):
    if _id == "-1": return {}
    try:
      return self.service.get_by_id(_id)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on get retaurant with id %s" % _id}, 461

  def put(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      self.service.save(item)
      return {"status": "success", "data": item}
    except DuplicateStoreNameException as e:
      self.log.exception(e)
      return {"status": "error", "message": "Store name already exists."}, 462
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to save store details! Please try again later"), 463

  def post(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = g.user.tenant_id
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      _id = self.service.save(item)
      return {"status": "success", "location": "/api/store/" + str(_id)}
    except DuplicateStoreNameException as e:
      self.log.exception(e)
      return {"status": "error", "message": "Store name already exists."}, 462
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to save store details! Please try again later"), 464

  def delete(self, _id):
    try:
      self.service.delete(_id)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Store cannot be deleted"}, 465
    return None, 204
