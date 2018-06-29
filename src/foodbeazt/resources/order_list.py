from flask import g, request
from flask_restful import Resource
from service.OrderService import OrderService
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from foodbeazt.fapp import mongo
import logging


class OrderListApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)

    def get(self):
        tenant_id = g.user.tenant_id
        store_id = request.args.get("store_id", None)
        if store_id == '-1' or store_id == -1:
            store_id = None
            tenant_id = None

        page_no = int(request.args.get('page_no', 1))
        page_size = int(request.args.get('page_size', 50))
        filter_text = request.args.get('filter_text', None)
        order_no = request.args.get('order_no', None)
        order_status = request.args.get('order_status', None)
        latest = request.args.get('latest', '1') in ['true', 'True', '1']

        if order_status is None or len(order_status) == 0:
            order_status = "PENDING,PREPARING,PROGRESS"

        try:
            orders, total = self.service.search(tenant_id=tenant_id,
                                                store_id=store_id,
                                                page_no=page_no,
                                                page_size=page_size,
                                                order_no=order_no,
                                                order_status=order_status,
                                                filter_text=filter_text,
                                                latest_first=latest)

            if orders and len(orders) > 0:
                store_ids = set()
                for order in orders:
                    for sid in [str(x.get('store_id')) for x in order['items']]:
                        store_ids.add(sid)
                stores = self.storeService.search_by_ids(store_ids=store_ids)
                for order in orders:
                    for item in order['items']:
                        item['store'] = next((x for x in stores if x['_id'] == item['store_id']), None)
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
            url = "/api/orders/?page_no=%d&page_size=%d&filter_text=%s&order_status=%s&latest=%s"
            if total > offset:
                result["next"] = url % (page_no+1, page_size, filter_text, order_status, latest)
            if page_no > 1:
                result["previous"] = url % (page_no-1, page_size, filter_text, order_status, latest)

            return result
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on searching orders"}, 420


class StoreOrderListApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)

    def get(self):
        tenant_id = g.user.tenant_id
        store_id = request.args.get("store_id", None)
        if store_id == '-1' or store_id == -1 or store_id is None or len(store_id) == 0:
            return {"status": "error", "message": "Store Identifier is required!"}, 420

        page_no = int(request.args.get('page_no', 1))
        page_size = int(request.args.get('page_size', 50))
        filter_text = request.args.get('filter_text', None)
        order_no = request.args.get('order_no', None)
        order_status = request.args.get('order_status', None)
        latest = request.args.get('latest', '1') in ['true', 'True', '1']

        if order_status is None or len(order_status) == 0:
            order_status = "PENDING,PREPARING,PROGRESS"

        try:
            orders, total = self.storeOrderService.search(tenant_id=tenant_id,
                                                          store_id=store_id,
                                                          page_no=page_no,
                                                          page_size=page_size,
                                                          order_no=order_no,
                                                          order_status=order_status,
                                                          filter_text=filter_text,
                                                          latest_first=latest)

            if orders and len(orders) > 0:
                store_ids = set()
                for order in orders:
                    for sid in [str(x.get('store_id')) for x in order['items']]:
                        store_ids.add(sid)
                stores = self.storeService.search_by_ids(store_ids=store_ids)
                for order in orders:
                    for item in order['items']:
                        item['store'] = next((x for x in stores if x['_id'] == item['store_id']), None)
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
