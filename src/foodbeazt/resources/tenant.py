from bson import json_util, ObjectId
from flask import request, session, g
from flask_restful import Resource
from service.TenantService import TenantService, DuplicateTenantNameException, DuplicateTenantUrlException
from service.UserService import DuplicateUserException
from foodbeazt.fapp import mongo


class TenantListApi(Resource):
    def __init__(self):
        self.service = TenantService(mongo.db)

    def get(self):
        return self.service.search(tenant_id=g.user.tenant_id)


class TenantApi(Resource):
    def __init__(self):
        self.service = TenantService(mongo.db)

    def get(self, _id):
        if _id == "-1" or _id is None:
            return {}
        return self.service.get_by_id(_id)

    def put(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = ObjectId(tenant_id)
        try:
            self.service.update(item)
            return {"status": "success",  "data": item}
        except DuplicateTenantNameException as e:
            print(e)
            return {"status": "error", "message": "Tenant name already exists."}
        except DuplicateTenantUrlException as e:
            print(e)
            return {"status": "error", "message": "Tenant url already exists."}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save tenant details! Please try again later")

    def post(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = ObjectId(tenant_id)
        item['registered_ip'] = request.remote_addr
        try:
            _id = self.service.create(item)
            return {"status": "success", "location": "/api/tenant/" + str(_id)}
        except DuplicateTenantNameException as e:
            print(e)
            return {"status": "error", "message": "Tenant name already exists."}
        except DuplicateTenantUrlException as e:
            print(e)
            return {"status": "error", "message": "Tenant url already exists."}
        except DuplicateUserException as e:
            print(e)
            return {"status": "error", "message": "Contact Email already exists."}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save tenant details! Please try again later")

    def delete(self, _id):
        return None, 204