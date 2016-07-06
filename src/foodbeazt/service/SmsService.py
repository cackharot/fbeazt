from datetime import datetime
from bson import ObjectId
import re
import random
import string

class SmsService(object):
  def __init__(self, db, user, api_key):
    self.db = db
    self.user = user
    self.api_key = api_key
    self.sms_store = db.sms_collection
    self.otp_store = db.sms_otp_collection

  def send_otp(self, number, otp, message):
    print("Sending OTP SMS [%s] -> [%s](Count:%d)" % (number, message, len(message)))
    item = dict(number=number, message=message, char_count=len(message), created_at=datetime.now(),
                status='SENT', otp=otp, details="")
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
    print("GENERATED OTP %s" % (otp))
    return otp

  def update_otp(self, number, otp):
    query = self.otp_store.find({'number':number,'otp':otp})
    if query.count() == 0: return False
    item = query[0]
    item['status'] = 'VERIFIED'
    item['verified_at'] = datetime.now()
    self.otp_store.save(item)
    return True

  def verified_number(self, number):
    return self.otp_store.find({'number': number, 'status': 'VERIFIED'}).count() > 0

  def check_otp(self, number, otp):
    query = self.otp_store.find({'number': number, 'otp': otp})
    return query.count() == 1

  def send(self, number, message):
    print("Sending SMS [%s] -> [%s](Count:%d)" % (number, message, len(message)))
    item = dict(number=number, message=message, char_count=len(message), created_at=datetime.now(), status='I', details="")
    _id = self.sms_store.save(item)
    print(item)
    return 'SENT'
