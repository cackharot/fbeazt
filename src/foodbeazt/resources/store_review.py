from bson import ObjectId, json_util
from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreReviewService, FrequentStoreReviewException
from foodbeazt.fapp import mongo, admin_permission
import logging


class StoreReviewApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = StoreReviewService(mongo.db)

    def get(self, store_id):
        if store_id == "-1":
            return []
        try:
            tenant_id = g.user.tenant_id
            items, total = self.service.search(tenant_id, store_id)
            return {'items': items, 'total': total}
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on get store reviews with id %s" % store_id}, 461

    def put(self, store_id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            self.service.save(item)
            return {"status": "success", "data": item}
        except Exception as e:
            self.log.exception(e)
            return dict(status="error",
                        message="Oops! Error while trying to save store review details! Please try again later"), 463

    def post(self, store_id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = g.user.tenant_id
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            _id = self.service.save(item)
            return {"status": "success", "location": "/api/store/" + str(_id)}
        except FrequentStoreReviewException as e:
            self.log.exception(e)
            return dict(status="error", message=str(e)), 464
        except Exception as e:
            self.log.exception(e)
            return dict(status="error",
                        message="Oops! Error while trying to save store details! Please try again later"), 464

    def delete(self, store_id):
        try:
            _id = request.params.get('_id')
            self.service.delete(store_id, _id)
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Store review cannot be deleted"}, 465
        return None, 204
