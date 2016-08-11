from flask import redirect, request, render_template
from flask.views import View
import hashlib
from service.OrderService import OrderService, DuplicateOrderException
from foodbeazt.fapp import mongo, app
import logging

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
    data = self.build_payumoney_request(order_no,firstname,email,phone,amount)
    return render_template('payment_redirect.jinja2', data=data,action=self.config_payu_base_url)

  def build_payumoney_request(self, order_no, firstname, email, phone, amount):
    posted={}
    # posted['productinfo'] = self.get_product_info(order_no)
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

  def get_product_info(self, order_no):
    return  {
      "paymentParts": [
        {
          "name":"abc",
          "description":"abcd",
          "value":"500",
          "isRequired":"true",
          "settlementEvent" : "EmailConfirmation"
        },
        {
          "name":"xyz",
          "description":"wxyz",
          "value":"1500",
          "isRequired":"false",
          "settlementEvent" : "EmailConfirmation"
        }
      ],
      "paymentIdentifiers": [
        {
          "field":"CompletionDate",
          "value":"31/10/2012"
        },
        {
          "field":"TxnId",
          "value":order_no
        }
      ]
    }

class PaymentSuccessView(View):
  methods = ['GET', 'POST']

  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)
    self.config_key = app.config['PAYUMONEY_MERCHANT_KEY']
    self.config_salt = app.config['PAYUMONEY_SALT']
    self.config_surl = app.config['PAYUMONEY_SURL']
    self.config_furl = app.config['PAYUMONEY_FURL']
    self.config_iurl = app.config['PAYUMONEY_IURL']
    self.config_payu_base_url = app.config['PAYUMONEY_BASE_URL']
    self.payment_success_url = app.config['PAYMENT_SUCCESS_UI_URL']
    self.payment_failure_url = app.config['PAYMENT_FAILURE_UI_URL']

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

    if(hashh != posted_hash):
      self.log.warning("Invalid hash for the payment! order_no [%s], payumoney response" % (txnid, request.form))
      order['payment_status'] = 'invalid'
    else:
      order['payment_status'] = status
      order['payment_pg_type'] = request.form.get('PG_TYPE', None)
      order['payment_bank_ref_no'] = request.form.get('bank_ref_num', None)
      order['payment_ref_mode'] = request.form.get('mode', None)
      order['payment_bankcode'] = request.form.get('bankcode', None)
      order['payment_error_no'] = request.form.get('error', None)
      order['payment_error_message'] = request.form.get('error_Message', None)
      order['payment_encryptedPaymentId'] = request.form.get('encryptedPaymentId', None)
      order['payment_payuMoneyId'] = request.form.get('payuMoneyId', None)
      order['payment_cardnum'] = request.form.get('cardnum', None)
      order['payment_mihpayid'] = request.form.get('mihpayid', None)
      order['payment_net_amount_debit'] = request.form.get('net_amount_debit', None)
      order['payment_amount'] = amount
      order['payment_additional_charges'] = additionalCharges
      if status == 'success':
        redirect_url = self.payment_success_url
    # print(order)
    try:
      self.service.save(order)
    except Exception as e:
      self.log.exception(e)

    return redirect(redirect_url)

class PaymentWebHookView(View):
  methods = ['GET', 'POST']

  def __init__(self):
    self.log = logging.getLogger(__name__)
    self.service = OrderService(mongo.db)

  def dispatch_request(self):
    return None, 204
