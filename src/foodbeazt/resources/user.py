from bson import json_util, ObjectId
from flask import request, session, g
from flask_restful import Resource
from service.UserService import UserService, DuplicateUserException, UserServiceException
from foodbeazt.fapp import mongo
import logging

class UserListApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = UserService(mongo.db)

  def get(self):
    try:
      self.log.info("Searching for users")
      lst = self.service.search(tenant_id=g.user.tenant_id)
      return lst
    except Exception as e:
      self.log.exception(e)
    return []

class UserApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = UserService(mongo.db)

  def get(self, _id):
    if _id == "-1" or _id is None: return {}
    try:
      return self.service.get_by_id(_id)
    except Exception as e:
      self.log.exception(e)
    return None

  def put(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = session.get('tenant_id', None)
    item['username'] = item['email']
    item['tenant_id'] = ObjectId(tenant_id)
    try:
      self.service.update(item)
      return {"status": "success",  "data": item}
    except DuplicateUserException as e:
      self.log.exception(e)
      return {"status": "error", "message": "User email already exists."}
    except Exception as e:
      self.log.exception(e)
      return dict(status="error",
                  message="Oops! Error while trying to save user details! Please try again later")

  def post(self, _id):
    item = json_util.loads(request.data.decode('utf-8'))
    tenant_id = session.get('tenant_id', None)
    item['username'] = item['email']
    item['tenant_id'] = ObjectId(tenant_id)
    item['registered_ip'] = request.remote_addr
    try:
        print(item)
        _id = self.service.create(item)
        return {"status": "success", "location": "/api/user/" + str(_id)}
    except DuplicateUserException as e:
      self.log.exception(e)
      return {"status": "error", "message": "User email already exists."}
    except Exception as e:
      self.log.exception("Error on add user",e)
      return dict(status="error",
                  message="Oops! Error while trying to save user details! Please try again later")

  def delete(self, _id):
    try:
      self.service.delete(_id)
    except UserServiceException as e:
      self.log.exception(e)
      return dict(status="error", message=str(e)), 400
    return None, 204
