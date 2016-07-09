from bson import json_util, ObjectId
from flask import request, session, g
from flask_restful import Resource
from service.TenantService import TenantService, DuplicateTenantNameException, DuplicateTenantUrlException
from service.UserService import DuplicateUserException
from foodbeazt.fapp import mongo
import logging

class TenantListApi(Resource):
    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = TenantService(mongo.db)

    def get(self):
        try:
            return self.service.search(tenant_id=g.user.tenant_id)
        except Exception as e:
            self.log.exception(e)
        return {"status": "error", "message": "Error on searching tenants"}, 440


class TenantApi(Resource):
    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = TenantService(mongo.db)

    def get(self, _id):
        if _id == "-1" or _id is None: return {}
        try:
            return self.service.get_by_id(_id)
        except Exception as e:
            self.log.exception(e)
        return {"status": "error", "message": "Error on get tenant with id %s" % _id}, 441

    def put(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            self.service.update(item)
            return {"status": "success",  "data": item}
        except DuplicateTenantNameException as e:
            self.log.exception(e)
            return {"status": "error", "message": "Tenant name already exists."}, 442
        except DuplicateTenantUrlException as e:
            self.log.exception(e)
            return {"status": "error", "message": "Tenant url already exists."}, 443
        except Exception as e:
            self.log.exception(e)
            return dict(status="error",
                        message="Oops! Error while trying to save tenant details! Please try again later"), 444

    def post(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = ObjectId(tenant_id)
        item['registered_ip'] = request.remote_addr
        try:
            _id = self.service.create(item)
            return {"status": "success", "location": "/api/tenant/" + str(_id)}
        except DuplicateTenantNameException as e:
            self.log.exception(e)
            return {"status": "error", "message": "Tenant name already exists."}, 442
        except DuplicateTenantUrlException as e:
            self.log.exception(e)
            return {"status": "error", "message": "Tenant url already exists."}, 443
        except DuplicateUserException as e:
            self.log.exception(e)
            return {"status": "error", "message": "Contact Email already exists."}, 445
        except Exception as e:
            self.log.exception(e)
            return dict(status="error",
                        message="Oops! Error while trying to save tenant details! Please try again later"), 446

    def delete(self, _id):
        return None, 204
