from flask import g, request
from flask_restful import Resource
from service.OrderService import OrderService
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from foodbeazt.fapp import mongo, store_admin_permission, admin_permission
import logging
import itertools


class StoreOrderListApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)

    def get(self, store_id):
        tenant_id = g.user.tenant_id
        store_id = request.args.get("store_id", store_id)
        if store_id == '-1' or store_id == -1 or store_id is None or len(store_id) == 0:
            return {"status": "error", "message": "Store Identifier is required!"}, 420

        if not (store_admin_permission.can() or admin_permission.can()):
            return {"status": "error", "message": "UnAuthorized! Your are not a store admin"}, 403

        store = self.storeService.get_by_id(store_id)
        if store is None:
            return {"status": "error", "message": "Store Identifier is invalid!"}, 421

        if not admin_permission.can() and store['contact_email'] != g.user.email:
            return {"status": "error", "message": "You are not authozied to view this store!"}, 403

        page_no = int(request.args.get('page_no', 1))
        page_size = int(request.args.get('page_size', 50))
        filter_text = request.args.get('filter_text', None)
        order_no = request.args.get('order_no', None)
        order_status = request.args.get('order_status', None)
        latest = request.args.get('latest', '1') in ['true', 'True', '1']
        only_today = request.args.get('only_today', '1') in ['true', 'True', '1']

        if order_status is None or len(order_status) == 0:
            order_status = "PENDING,PREPARING,PROGRESS"

        try:
            store_order_id = request.args.get('store_order_id', None)
            if store_order_id is not None:
                store_order = self.storeOrderService.get_by_id(store_order_id, store_id)
                return store_order

            orders, total = self.storeOrderService.search(tenant_id=tenant_id,
                                                          store_id=store_id,
                                                          page_no=page_no,
                                                          page_size=page_size,
                                                          order_no=order_no,
                                                          order_status=order_status,
                                                          filter_text=filter_text,
                                                          only_today=only_today,
                                                          latest_first=latest)

            offset = page_no*page_size
            result = {'items': orders, 'total': total,
                      'filter_text': filter_text,
                      'store_id': store_id,
                      'order_status': None,
                      'latest': latest,
                      'page_no': page_no,
                      'page_size': page_size}
            if order_status:
                result['order_status'] = order_status.split(',')
            url = "/api/store_orders/?store_id=%s&page_no=%d&page_size=%d&filter_text=%s&order_status=%s&latest=%s"
            if total > offset:
                result["next"] = url % (store_id, page_no+1, page_size, filter_text, order_status, latest)
            if page_no > 1:
                result["previous"] = url % (store_id, page_no-1, page_size, filter_text, order_status, latest)

            return result
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on searching orders"}, 420
