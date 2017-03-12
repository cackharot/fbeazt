from datetime import datetime
from dateutil.parser import parse as dtparse
from flask import g, request
from service.OrderService import OrderService, DuplicateOrderException
from service.ProductService import ProductService
from flask.ext.restful import Resource
from foodbeazt.fapp import mongo, app, mail, export_data_folder, import_data_folder
from libs.order_helper import OrderHelper
from bson import json_util
import logging
import requests

class ValidateCouponApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.productService = ProductService(mongo.db)
    self.helper = OrderHelper(self.productService)
    self.coupon_api_url = app.config.get('COUPON_API_URL', None)
    if self.coupon_api_url is None:
      raise Exception('COUPON_API_URL is required!')

  def post(self):
    try:
      tenant_id = g.user.tenant_id
      order = json_util.loads(request.data.decode('utf-8'))
      self.log.debug("RECEIVED ORDER %s" % order)
      coupon_code = order.get('coupon_code', None)

      if coupon_code is None or len(coupon_code) < 4:
        return {'status':'error','message':'Invalid coupon code!'}, 471

      validation_error, sanitized_items = self.helper.validate_line_items(order)
      if validation_error is not None:
        return dict(status='error', type='validation', message=validation_error), 425

      order['items'] = sanitized_items
      order['delivery_charges'] = self.service.get_delivery_charges(order)
      order['total'] = self.service.get_order_total(order)

      coupon_data = self.fetch_coupon_data(coupon_code)
      if coupon_data is None:
        return {'status':'error','message':'Invalid coupon code!'}, 474

      if not self.valid_coupon(coupon_data):
        return {'status':'error','message':'Coupon code was expired!'}, 473

      amount = self.calculate_discount(order, coupon_data)

      if amount <= 0.0:
        self.log.info('Coupon code does not meet the conditions! %s %s', coupon_code, self.cal_order_total_without_delivery(order))
        return {'status':'error','message':'Coupon code does not meet the conditions!'}, 472

      return {'coupon_code': coupon_code, 'amount': -amount}
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error while validating coupon data"}, 471

  def fetch_coupon_data(self, coupon_code):
    try:
      r = requests.get(self.coupon_api_url,params={'code': coupon_code},timeout=3)
      if r.status_code != 200 or len(r.json()) != 1:
        return None
      return r.json()[0]
    except Exception as e:
      self.log.exception(e)
      return None

  def valid_coupon(self, coupon):
    if not coupon.get('status', False):
      self.log.info('Coupon code disabled %s', coupon.get('code'))
      return False
    start = dtparse(coupon.get('start')).date()
    end = dtparse(coupon.get('end')).date()
    now = datetime.utcnow().date()
    self.log.info('Comparing coupon dates %s %s %s', start, end, now)
    return start < now and end > now

  def calculate_discount(self, order, coupon):
    ctype = coupon['type']
    threshold = float(coupon.get('orderThreshold',0.0))
    discount = float(coupon.get('discount',0.0))
    maxDiscountAmount = float(coupon.get('maxDiscountAmount',0.0))
    order_total = self.cal_order_total_without_delivery(order)
    amt = order_total*(discount/100.0)

    if ctype == 'FreeDelivery':
      return self.cal_delivery_charges(order)
    elif ctype == 'MaxAmountThresholdDiscount':
      if order_total < threshold:
        return 0.0
      if amt > maxDiscountAmount:
        return maxDiscountAmount
      return amt
    elif ctype == 'FlatDiscountWithCap':
      if amt > maxDiscountAmount:
        return maxDiscountAmount
      return amt
    elif ctype == 'FlatDiscountWithoutCap':
      return amt
    else:
      self.log.warn("invalid coupon type")
    return 0.0

  def cal_delivery_charges(self, order):
    return order.get('delivery_charges', 0.0)
    
  def cal_order_total_without_delivery(self, order):
    return order.get('total') - self.cal_delivery_charges(order)