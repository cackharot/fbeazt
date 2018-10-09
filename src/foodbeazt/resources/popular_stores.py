from bson import json_util
from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreService
from foodbeazt.fapp import mongo, admin_permission
import logging


class PopularStoresApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = StoreService(mongo.db)

    def get(self, _id):
        tenant_id = g.user.tenant_id
        try:
            items = self.service.get_popular_items(tenant_id)
            return {"items": items, "total": len(items)}
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on searching popular stores"}, 460

    def put(self, _id):
        if not admin_permission.can():
            return "Unauthorized", 403
        # tenant_id = g.user.tenant_id
        data = json_util.loads(request.data.decode('utf-8'))
        try:
            self.service.update_popular_item_no(_id, data['no'])
            return None, 204
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error in updating popular store"}, 460

    def post(self, _id):
        if not admin_permission.can():
            return "Unauthorized", 403
        tenant_id = g.user.tenant_id
        if _id is None:
            return {"status": "error", "message": "Invalid store id"}, 460
        item = self.service.get_by_id(_id)
        if item is None:
            return {"status": "error", "message": "Invalid store id"}, 460
        try:
            fav_id = self.service.add_popular_item(tenant_id, _id)
            return {
                "status": "success",
                "location": "/api/popular_stores/%s" % (str(fav_id)),
                "_id": str(fav_id)
            }
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on saving popular store"}, 460

    def delete(self, _id):
        if not admin_permission.can():
            return "Unauthorized", 403
        tenant_id = g.user.tenant_id
        if _id is None:
            return {"status": "error", "message": "Invalid store id"}, 460
        item = self.service.get_by_id(_id)
        if item is None:
            return {"status": "error", "message": "Invalid store id"}, 460
        try:
            self.service.delete_popular_item(tenant_id, _id)
            return None, 204  # No content
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Error on deleting popular store"}, 460
