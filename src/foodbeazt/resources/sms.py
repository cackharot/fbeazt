from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.SmsService import SmsService
from foodbeazt.fapp import app, mongo
import logging

class SmsApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.smsService = SmsService(mongo.db, app.config['SMS_USER'], app.config['SMS_API_KEY'])

  def get(self):
    tenant_id = g.user.tenant_id
    try:
      page_no = int(request.args.get('page_no', 1))
      page_size = int(request.args.get('page_size', 50))
      is_otp = request.args.get('is_otp', None) in ["true","True","1"]

      items, total = self.smsService.search(tenant_id=tenant_id,page_no=page_no,page_size=page_size,is_otp=is_otp)
      offset = page_no*page_size
      result = { "items": items, "total": total, "page_no": page_no, "page_size": page_size, "is_otp": is_otp }
      url = "/api/sms?page_no=%d&page_size=%d&is_otp=%s"
      if total > offset:
        result["next"] =  url % (page_no+1,page_size,is_otp)
      if page_no > 1:
        result["previous"] = url % (page_no-1,page_size,is_otp)

      return result
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on searching sms messages"}, 460

  def delete(self):
    tenant_id = g.user.tenant_id
    _id = request.args.get('_id', None)
    is_otp = request.args.get('is_otp', None) in ["true","True","1"]
    if _id is None or len(_id) != 24:
      return {"status": "error", "message": "Invalid sms message id"}, 460
    try:
      self.smsService.delete(tenant_id, _id, is_otp)
      return None, 204 # No content
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on deleting sms message"}, 460
