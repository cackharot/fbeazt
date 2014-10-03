from bson import json_util
from flask import request, session, g
from flask_restful import Resource
from fbeazt.service.UserService import UserService, DuplicateUserException
from foodbeazt import mongo


class UserListApi(Resource):
    def __init__(self):
        self.service = UserService(mongo.db)

    def get(self):
        lst = self.service.search(tenant_id=g.user.tenant_id)
        print(lst)
        return lst


class UserApi(Resource):
    def __init__(self):
        self.service = UserService(mongo.db)

    def get(self, _id):
        if _id == "-1" or _id is None:
            return {}
        return self.service.get_by_id(_id)

    def put(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = tenant_id
        try:
            self.service.update(item)
            return {"status": "success",  "data": item}
        except DuplicateUserException as e:
            return {"status": "error", "message": "User email already exists."}
        except Exception as e:
            print(e)
            return dict(status="error",
                        message="Oops! Error while trying to save user details! Please try again later")

    def post(self, _id):
        item = json_util.loads(request.data.decode('utf-8'))
        tenant_id = session.get('tenant_id', None)
        item['tenant_id'] = tenant_id
        item['registered_ip'] = request.remote_addr
        try:
            _id = self.service.create(item)
            return {"status": "success", "location": "/api/user/" + str(_id)}
        except DuplicateUserException as e:
            return {"status": "error", "message": "User email already exists."}
        except Exception as e:
            return dict(status="error",
                        message="Oops! Error while trying to save user details! Please try again later")

    def delete(self, _id):
        return None, 204