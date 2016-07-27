from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.OrderService import OrderService
from foodbeazt.fapp import mongo
import logging

class ReportApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)

  def get(self):
    result = {'total': 0,'pending':0,'preparing':0,'cancelled':0,'delivered':0}

    try:
      tenant_id = g.user.tenant_id
      result = self.service.generate_report(tenant_id)
    except Exception as e:
      self.log.exception(e)

    return result
