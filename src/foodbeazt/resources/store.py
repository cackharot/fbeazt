from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreService, DuplicateStoreNameException
from foodbeazt import mongo


class StoreListApi(Resource):
    def __init__(self):
        self.service = StoreService(mongo.db)

    def get(self):
        lst = self.service.search(tenant_id=g.user.tenant_id)
        return lst


class StoreApi(Resource):
    def __init__(self):
        self.service = StoreService(mongo.db)

    def get(self, _id):
        if _id == "-1":
            return {}
        return self.service.get_by_id(_id)

    def put(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            self.service.save(item)
            return {"status": "success", "data": item}
        except DuplicateStoreNameException as e:
            print(e)
            return {"status": "error", "message": "Store name already exists."}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save store details! Please try again later")

    def post(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            _id = self.service.save(item)
            return {"status": "success", "location": "/api/store/" + str(_id)}
        except DuplicateStoreNameException as e:
            print(e)
            return {"status": "error", "message": "Store name already exists."}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save store details! Please try again later")

    def delete(self, _id):
        self.service.delete(_id)
        return None, 204