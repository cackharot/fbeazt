from datetime import datetime
from dateutil import parser as dtparser
from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.StoreOrderService import StoreOrderService
from service.StoreService import StoreService
from foodbeazt.fapp import mongo, store_admin_permission
import logging


class StoreOrderReportApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)
        self.report_map = {
            'day_orders': self.service.generate_report,
            'order_trends': self.service.order_trend
        }

    def get(self, store_id):
        if store_id == '' or store_id == '-1':
            return dict(status="error", message="store_id is required"), 446
        if not store_admin_permission.can():
            return dict(status="error", message="Unauthorized! You cannot view store order reports!"), 403
        report_type = request.args.get('report_type', 'day_orders')
        if report_type in self.report_map:
            return self.exec_report(report_type, store_id)
        return []

    def exec_report(self, report_type, store_id):
        result = {}
        try:
            today = datetime.now()
            tenant_id = g.user.tenant_id
            today_iso = today.isoformat()
            start_date = None
            end_date = None
            if 'start_date' in request.args:
                start_date = dtparser.parse(request.args.get('start_date')).date()
            if 'end_date' in request.args:
                end_date = dtparser.parse(request.args.get('end_date')).date()
            result = self.report_map[report_type](tenant_id, store_id, start_date, end_date)
        except Exception as e:
            self.log.exception(e)
            return dict(status="error", message="Error while generating store order reports"), 447
        return result

