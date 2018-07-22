from collections import defaultdict
from flask import g, request
from flask_restful import Resource
from service.OrderService import OrderService
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from foodbeazt.fapp import mongo, admin_permission
import logging


class OrderListApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = OrderService(mongo.db)
        self.storeOrderService = StoreOrderService(mongo.db)
        self.storeService = StoreService(mongo.db)

    def update_store_data(self, orders):
        if not orders or len(orders) == 0:
            return
        store_ids = []
        for order in orders:
            store_ids = set([*store_ids, *[str(x['store_id']) for x in order['items']]])
        stores = {str(x['_id']): x for x in self.storeService.search_by_ids(store_ids=store_ids)}
        for order in orders:
            for item in order['items']:
                item['store'] = stores[str(item['store_id'])]

    def update_store_status(self, orders):
        if not orders or len(orders) == 0:
            return
        order_dict = {str(x['_id']): x for x in orders}
        store_statuses = defaultdict(dict)
        for x in self.storeOrderService.get_by_order_ids(order_dict.keys()):
           oid = str(x['order_id'])
           store_id = str(x['store_id'])
           store_statuses[oid][store_id] = dict(no=x['store_order_no'], status_timings=x.get('status_timings',{}), status=x['status'])
           order_dict[oid]['store_delivery_status'] = store_statuses[oid]

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

            self.update_store_data(orders)
            if admin_permission.can():
                self.update_store_status(orders)
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
