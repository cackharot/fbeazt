from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from fbeazt.service.ProductService import ProductService
from foodbeazt import mongo


class ProductListApi(Resource):
    def __init__(self):
        self.service = ProductService(mongo.db)

    def get(self, store_id=None):
        if store_id == '-1' or store_id == -1:
            store_id = None
        lst = self.service.search(tenant_id=g.user.tenant_id, store_id=store_id)
        return lst


class ProductActivateApi(Resource):
    def __init__(self):
        self.service = ProductService(mongo.db)

    def put(self, store_id, _id):
        item = self.service.get_by_id(_id)
        if item['store_id'] == ObjectId(store_id):
            item['status'] = True
            self.service.update(item)
            return item
        return None, 404


class ProductApi(Resource):
    def __init__(self):
        self.service = ProductService(mongo.db)

    def get(self, store_id, _id):
        if _id == "-1":
            return {}
        return self.service.get_by_id(_id)

    def put(self, store_id, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['store_id'] = ObjectId(store_id)
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            self.service.update(item)
            return {"status": "success", "data": item}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save product details! Please try again later")

    def post(self, store_id, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['store_id'] = ObjectId(store_id)
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            _id = self.service.create(item)
            return {"status": "success", "location": "/api/product/" + str(store_id) + "/" + str(_id), "data": item}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save product details! Please try again later")

    def delete(self, store_id, _id):
        item = self.service.get_by_id(_id)
        if item is None:
            return None, 404
        item['status'] = False
        self.service.update(item)
        return None, 204