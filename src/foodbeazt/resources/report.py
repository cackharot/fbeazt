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
    self.report_map = {
      'grand_total': self.service.generate_report,
      'order_trend': self.service.order_trend,
      'revenue_trend': self.service.revenue_trend
    }

  def get(self):
    report_type = request.args.get('report_type', 'grand_total')
    if report_type in self.report_map:
      return self.exec_report(report_type)
    return []

  def exec_report(self, report_type):
    result = {}
    try:
      tenant_id = g.user.tenant_id
      result = self.report_map[report_type](tenant_id)
    except Exception as e:
      self.log.exception(e)
    return result