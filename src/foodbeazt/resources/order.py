from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from fbeazt.service.OrderService import OrderService
from foodbeazt import mongo


class OrderListApi(Resource):
    def __init__(self):
        self.service = OrderService(mongo.db)

    def get(self):
        tenant_id = g.user.tenant_id
        store_id = None
        if store_id == '-1' or store_id == -1:
            store_id = None
            tenant_id = None

        page_no = int(request.args.get('page_no', 1))
        page_size = int(request.args.get('page_size', 24))
        filter_text = request.args.get('filter_text', None)

        items, total = self.service.search(tenant_id=tenant_id, store_id=store_id, page_no=page_no,
                                           page_size=page_size,
                                           filter_text=filter_text)
        return {'items': items, 'total': total}


class OrderApi(Resource):
    def __init__(self):
        self.service = OrderService(mongo.db)

    def get(self, store_id, _id):
        if _id == "-1":
            return {}
        return self.service.get_by_id(_id)

    def post(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            _id = self.service.save(item)
            return {"status": "success", "location": "/api/order/" + str(_id), "data": item}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save order details! Please try again later")

    def delete(self, store_id, _id):
        item = self.service.get_by_id(_id)
        if item is None:
            return None, 404
        item['status'] = False
        self.service.delete(item)
        return None, 204