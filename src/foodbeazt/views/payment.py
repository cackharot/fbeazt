from flask import redirect, request, render_template, g
from flask.views import View
from flask_restful import Resource
import hashlib
from service.OrderService import OrderService, DuplicateOrderException
from service.PaymentService import PaymentService
from foodbeazt.fapp import mongo, app
import logging

from resources.order import OrderApi

class PaymentListApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.paymentService = PaymentService(mongo.db)

  def get(self):
    tenant_id = g.user.tenant_id
    store_id = request.args.get("store_id", None)
    if store_id == '-1' or store_id == -1:
      store_id = None
      tenant_id = None

    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 50))
    order_no = request.args.get('order_no', None)
    status = request.args.get('status', '')

    try:
      items, total = self.paymentService.search(tenant_id=tenant_id,
                            store_id=store_id,
                            page_no=page_no,
                            page_size=page_size,
                            order_no=order_no,
                            status=status)
      offset = page_no*page_size
      result = {'items': items, 'total': total,
                "status": status.split(','),
                "page_no": page_no,
                "page_size": page_size}
      url = "/api/payments?page_no=%d&page_size=%d&status=%s"
      if total > offset:
        result["next"] =  url % (page_no+1,page_size,status)
      if page_no > 1:
        result["previous"] = url % (page_no-1,page_size,status)

      return result
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error on searching order payments"}, 420

class PaymentRedirectView(View):
  methods = ['POST']

  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.config_key = app.config['PAYUMONEY_MERCHANT_KEY']
    self.config_salt = app.config['PAYUMONEY_SALT']
    self.config_surl = app.config['PAYUMONEY_SURL']
    self.config_furl = app.config['PAYUMONEY_FURL']
    self.config_iurl = app.config['PAYUMONEY_IURL']
    self.config_payu_base_url = app.config['PAYUMONEY_BASE_URL']

  def dispatch_request(self):
    # hash_object = hashlib.sha256(b'randint(0,20)')
    # txnid=hash_object.hexdigest()[0:20]
    order_no = request.form.get('order_no', None)
    order = self.service.get_by_number(order_no)
    if order is None or order['payment_type'] != 'payumoney' or order['total'] <= 0.0:
      return redirect(self.config_iurl)
    email = order['delivery_details']['email']
    phone = order['delivery_details']['phone']
    firstname = order['delivery_details']['name']
    amount = float(order['total'])
    data = self.build_payumoney_request(order, order_no,firstname,email,phone,amount)
    return render_template('payment_redirect.jinja2', data=data,action=self.config_payu_base_url)

  def build_payumoney_request(self, order, order_no, firstname, email, phone, amount):
    posted={}
    # posted['productinfo'] = self.get_product_info(order)
    posted['productinfo'] = '{}'
    posted['firstname'] = firstname
    posted['email'] = email
    posted['phone'] = phone
    posted['amount']= amount
    posted['txnid'] = order_no
    posted['key']   = self.config_key
    posted['surl']  = self.config_surl
    posted['furl']  = self.config_furl
    posted['service_provider']='payu_paisa'
    posted['hash'] = self.get_payu_hash(posted)
    return posted

  def get_payu_hash(self, data):
    hash_string=''
    hashSequence = "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10"
    hashVarsSeq=hashSequence.split('|')
    for i in hashVarsSeq:
      try:
        hash_string+=str(data[i])
      except Exception:
        hash_string+=''
      hash_string+='|'
    hash_string+=self.config_salt
    return hashlib.sha512(hash_string.encode('utf-8')).hexdigest().lower()

  def get_product_info(self, order):
    paymentParts = []
    for item in order['items']:
      paymentParts.append({
          "name": item['name'],
          "description": item.get('description', 'No Description'),
          # "value": float(item['quantity'])*float(item['price']),
          "value": float(item['quantity']),
          "isRequired": True,
          "settlementEvent" : "EmailConfirmation"
        })
    return {
      "paymentParts": paymentParts,
      "paymentIdentifiers": [
        {
          "field":"CompletionDate",
          "value":"31/10/2012"
        },
        {
          "field":"TxnId",
          "value":order['order_no']
        }
      ]
    }

class PaymentSuccessView(View):
  methods = ['GET', 'POST']

  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.paymentService = PaymentService(mongo.db)
    self.config_key = app.config['PAYUMONEY_MERCHANT_KEY']
    self.config_salt = app.config['PAYUMONEY_SALT']
    self.config_surl = app.config['PAYUMONEY_SURL']
    self.config_furl = app.config['PAYUMONEY_FURL']
    self.config_iurl = app.config['PAYUMONEY_IURL']
    self.config_payu_base_url = app.config['PAYUMONEY_BASE_URL']
    self.payment_success_url = app.config['PAYMENT_SUCCESS_UI_URL']
    self.payment_failure_url = app.config['PAYMENT_FAILURE_UI_URL']
    self.orderView = OrderApi()

  def dispatch_request(self):
    c = {}
    # print(request.form)
    status=request.form["status"]
    firstname=request.form["firstname"]
    amount=request.form["amount"]
    txnid=request.form["txnid"]
    posted_hash=request.form["hash"]
    key=request.form["key"]
    productinfo=request.form["productinfo"]
    email=request.form["email"]
    additionalCharges=request.form.get('additionalCharges',None)
    salt = self.config_salt

    if additionalCharges is not None:
      retHashSeq=additionalCharges+'|'+salt+'|'+status+'|||||||||||'+email+'|'+firstname+'|'+productinfo+'|'+amount+'|'+txnid+'|'+key
    else:
      retHashSeq = salt+'|'+status+'|||||||||||'+email+'|'+firstname+'|'+productinfo+'|'+amount+'|'+txnid+'|'+key
    hashh=hashlib.sha512(retHashSeq.encode('utf-8')).hexdigest().lower()

    order = self.service.get_by_number(txnid)
    redirect_url = self.payment_failure_url
    payment_details = {
      'order_no': order['order_no'],
      'tenant_id': g.user.tenant_id,
      'user_id': order['user_id'],
      'gateway_name': 'payumoney'
    }

    if(hashh != posted_hash):
      self.log.warning("Invalid hash for the payment! order_no [%s], payumoney response" % (txnid, request.form))
      order['payment_status'] = 'invalid'
      payment_details['status'] = 'invaild hash'
    else:
      order['payment_status'] = status
      order['payment_error_message'] = request.form.get('error_Message', None)
      payment_details['status'] = status
      payment_details['pg_type'] = request.form.get('PG_TYPE', None)
      payment_details['bank_ref_no'] = request.form.get('bank_ref_num', None)
      payment_details['ref_mode'] = request.form.get('mode', None)
      payment_details['bankcode'] = request.form.get('bankcode', None)
      payment_details['error_no'] = request.form.get('error', None)
      payment_details['error_message'] = request.form.get('error_Message', None)
      payment_details['encryptedPaymentId'] = request.form.get('encryptedPaymentId', None)
      payment_details['payuMoneyId'] = request.form.get('payuMoneyId', None)
      payment_details['cardnum'] = request.form.get('cardnum', None)
      payment_details['mihpayid'] = request.form.get('mihpayid', None)
      payment_details['net_amount_debit'] = request.form.get('net_amount_debit', None)
      payment_details['amount'] = amount
      payment_details['additional_charges'] = additionalCharges
      if status in ['pending', 'success']:
        redirect_url = self.payment_success_url
        self.orderView.send_email(order)
        self.orderView.send_sms(order)
    # print(order)
    try:
      self.service.save(order)
      self.paymentService.save(payment_details)
    except Exception as e:
      self.log.exception(e)

    return redirect(redirect_url)

class PaymentWebHookView(View):
  methods = ['GET', 'POST']

  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.paymentService = PaymentService(mongo.db)

  def dispatch_request(self):
    print("^"*32)
    print(request.form)
    self.log.info(request.form)
    pdetails = {
      'tenant_id': g.user.tenant_id
    }
    for key in request.form.keys():
      pdetails[key] = request.form.get(key, None)
    print(pdetails)
    try:
      _id = self.paymentService.save_webhook(pdetails)
      return str(_id), 200
    except Exception as e:
      self.log.exception(e)
    return None, 400
