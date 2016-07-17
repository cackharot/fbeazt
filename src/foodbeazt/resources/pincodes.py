from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.PincodeService import PincodeService, DuplicatePincodeException
from foodbeazt.fapp import mongo
import logging

class PincodeListApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = PincodeService(mongo.db)

  def get(self):
    try:
      tenant_id = g.user.tenant_id
      return self.service.search(tenant_id)
    except Exception as e:
      self.log.exception(e)
      return {"status":"error","message":"Error while searching for pincode"}, 400

class PincodeApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = PincodeService(mongo.db)

  def get(self, _id):
    tenant_id = g.user.tenant_id
    try:
      return self.service.get(tenant_id, _id)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on fetching pincode details"}, 400

  def post(self, _id):
    tenant_id = g.user.tenant_id
    try:
      item = json_util.loads(request.data.decode('utf-8'))
      pincode = item.get("pincode", None)
      area = item.get("area", None)
      rate = float(item.get("rate", -1.0))
      if pincode is None or len(pincode) != 6:
        return {"status":"error","message": "Pincode is required and should be 6 digits"}
      if area is None or len(area) < 3 or len(area) > 200:
        return {"status":"error","message": "Area is required and should be 2-300 chars"}
      if rate <= -1.0 or rate > 100.00:
        return {"status":"error","message": "Rate is required and should be 0-100 units"}

      data = {}
      if _id != "-1" and len(_id) > 3:
        data = self.service.get(tenant_id, _id)
        if data is None:
          return {"status":"error","message":"Invalid id!"}
      data.update({
        'tenant_id':ObjectId(tenant_id),
        "pincode":pincode,
        "area":area,
        "rate":rate,
        "status":True
      })
      _id = self.service.save(data)
      return {
        "status":"success",
        "location": "/api/pincode/%s" % (str(_id)),
        "_id": str(_id)
      }
    except DuplicatePincodeException as de:
      self.log.exception(de)
      return {"status":"error","message": "Duplicate pincode found!"}, 400
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on saving popular dishes"}, 400

  def delete(self, _id):
    tenant_id = g.user.tenant_id
    if _id is None:
      return {"status": "error", "message": "Invalid pincode id"}, 400
    item = self.service.get(tenant_id, _id)
    if item is None:
      return {"status": "error", "message": "Invalid pincode id"}, 400
    try:
      self.service.delete(_id)
      return None, 204 # No content
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on deleting pincode details"}, 400
