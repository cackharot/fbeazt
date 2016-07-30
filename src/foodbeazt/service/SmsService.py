from datetime import datetime, timedelta
from bson import ObjectId
import re
import random
import string
import logging
from libs.sms_client import SmsClient

class SmsService(object):
  def __init__(self, db, access_key, private_key):
    self.log = logging.getLogger(__name__)
    self.db = db
    self.smsClient = SmsClient(access_key, private_key)
    self.sms_store = db.sms_collection
    self.otp_store = db.sms_otp_collection

  def send_otp(self, number, otp, message):
    self.log.info("Sending OTP SMS [%s] -> [%s](Count:%d)" % (number, message, len(message)))
    if self.check_otp(number, otp):
      self.log.warn("Trying to send duplicate OTP message %s" % (number))
      return 'SENT'
    aws_msg_id = self.smsClient.send(number, message)
    item = dict(number=number, message=message, char_count=len(message), created_at=datetime.now(),
                status='SENT', otp=otp, details="", aws_msg_id=aws_msg_id)
    _id = self.otp_store.save(item)
    return 'SENT'

  def generate_otp(self):
    unique = False
    count = 1
    otp = ""
    while not unique or count > 10:
      digits_f = "".join([random.choice(string.digits) for i in range(3)])
      digits_l = "".join([random.choice(string.digits) for i in range(3)])
      otp = digits_f + '' + digits_l
      unique = self.otp_store.find({'otp': otp}).count() == 0
      count =  count + 1
    if count > 10:
      raise Exception("Unable to generate OTP after 10 iteration!!")
    self.log.info("GENERATED OTP %s" % (otp))
    return otp

  def update_otp(self, number, otp):
    n = datetime.now() - timedelta(minutes=4)
    query = self.otp_store.find({'number':number,'created_at': {"$gt":n}}).sort('created_at', -1)
    if query.count() == 0: return False
    item = query[0]
    if item['otp'] != otp: return False
    item['status'] = 'VERIFIED'
    item['verified_at'] = datetime.now()
    self.otp_store.save(item)
    return True

  def verified_number(self, number):
    return self.otp_store.find({'number': number, 'status': 'VERIFIED'}).count() > 0

  def check_otp(self, number, otp):
    query = self.otp_store.find({'number': number, 'otp': otp})
    if query.count() == 1:
      return False
    n = datetime.now() - timedelta(minutes=2)
    query = self.otp_store.find({'number': number, 'created_at': {"$gt":n}})
    return query.count() != 0

  def send(self, number, message):
    self.log.info("Sending SMS [%s] -> [%s](Count:%d)" % (number, message, len(message)))
    if self.has_duplicate_message(number, message):
      self.log.warn("Trying to send duplicate message %s" % (number))
      return 'SENT'
    aws_msg_id = self.smsClient.send(number, message)
    item = dict(number=number, message=message, char_count=len(message), created_at=datetime.now(),
      status='I', details="", aws_msg_id=aws_msg_id)
    _id = self.sms_store.save(item)
    return 'SENT'

  def has_duplicate_message(self,number, message):
    query = self.sms_store.find({'number':number,'message':message})
    return query.count() > 1

  def get_order_count(self, number, email, minutes=15):
    n = datetime.now() - timedelta(minutes=minutes)
    query = { '$or': [{'email': email}, {'number': number}], 'created_at': { '$gt': n } }
    items = self.sms_store.find(query)
    return items.count()

  def search(self, tenant_id, page_no=1,page_size=50,is_otp=False):
    query = self.sms_store
    if is_otp: query = self.otp_store
    offset = (page_no - 1) * page_size
    if offset < 0: offset = 0
    lst = query.find().skip(offset).limit(page_size).sort("created_at", -1)
    return [x for x in lst], query.count()

  def delete(self, tenant_id, _id, is_otp=False):
    if is_otp:
      return self.otp_store.remove({"_id":ObjectId(_id)})
    return self.sms_store.remove({"_id":ObjectId(_id)})
