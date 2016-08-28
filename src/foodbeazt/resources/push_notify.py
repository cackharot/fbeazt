from flask import g, request
from flask_restful import Resource
from bson import ObjectId, json_util
from service.PushNotificationService import PushNotificationService
from service.UserService import UserService
from foodbeazt.fapp import mongo, app
import logging

from gcm import *

class RegisterPushNotify(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = PushNotificationService(mongo.db, app.config['GCM_API_KEY'])
    self.userService = UserService(mongo.db)

  def post(self):
    data = json_util.loads(request.data.decode('utf-8'))
    device_token = data.get('device_token', None)
    email = data.get('email', None)
    if device_token is None or email is None:
      return {'status':'error','message': 'Invalid device_token or email address'}, 400

    user = self.userService.get_by_email(email)

    if user is None:
      return {'status':'error','message': 'Invalid user. Not found!'}, 400

    try:
      item ={
        'os': device_token['os'],
        'device_token': device_token['token'],
        'email': email,
        'user_id': user['_id']
      }
      self.log.info("Registering device %s, %s", email, device_token)
      _id = self.service.save(item)
      self.notify_device(item)
      return {'status':'success','_id': _id}, 200
    except Exception as e:
      self.log.exception(e)
      return {'status':'error','message':str(e)}, 400

  def notify_device(self, item):
    data = {'message': 'Device successfully registered with foodbeazt server','title':'Register'}
    reg_id = item['device_token']
    self.service.send_to_device(data, reg_id=reg_id)

class UnRegisterPushNotify(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = PushNotificationService(mongo.db, app.config['GCM_API_KEY'])
    self.userService = UserService(mongo.db)

  def post(self):
    data = json_util.loads(request.data.decode('utf-8'))
    device_token = data.get('device_token', None)

    if device_token is None:
      return {'status':'error','message': 'Invalid device_token'}, 400

    try:
      self.log.info("UnRegistering device %s", device_token)
      self.service.delete_by_device_token(device_token)
      return {'status':'success'}, 200
    except Exception as e:
      self.log.exception(e)
      return {'status':'error','message':str(e)}, 400
