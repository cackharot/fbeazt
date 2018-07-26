from flask import g, request
from flask_restful import Resource
from service.StoreService import StoreService
from service.StoreOrderService import StoreOrderService
from foodbeazt.fapp import mongo, store_admin_permission, admin_permission
import logging


class UserStores(Resource):

  def __init__(self):
    self.log= logging.getLogger(__name__)
    self.storeService = StoreService(mongo.db)

  def get(self):
    tenant_id = g.user.tenant_id
    if not store_admin_permission.can():
      return dict(status="error", message="Unauthorized! Not a store admin!"), 403

    email = g.user.email
    stores = self.storeService.get_by_email(email)

    return [self.response_data(x) for x in stores if x['status']]

  def response_data(self, store):
    return dict(_id=store['_id'],name=store['name'],address=store['address'])

