from datetime import datetime
from bson import ObjectId
import logging

from gcm import *

class PushNotificationService(object):
  def __init__(self, db, api_key):
    self.log = logging.getLogger(__name__)
    self.db = db
    self.api_key = api_key
    self.push_notify_store = self.db.push_notify_collection

  def search(self):
    lst = self.push_notify_store.find({}).sort("created_at", -1)
    return [x for x in lst]

  def get_device_token_by_email(self, email):
    lst = self.push_notify_store.find({'email':email})
    return [x['device_token'] for x in lst]

  def save(self, item):
    email = item['email']
    device_token = item['device_token']
    cnt = self.push_notify_store.remove({'email':email,'device_token':device_token})
    print("Deleting previous device token", cnt)
    item['created_at'] = datetime.now()
    return self.push_notify_store.save(item)

  def delete_by_device_token(self, device_token):
    return self.push_notify_store.remove({
      device_token: device_token
    })

  def send_to_device(self, data, reg_id=None,email=None):
    if self.api_key is None or self.api_key == "False" or len(self.api_key) < 3:
      self.log.info("Device Notification disabled!!")
      return
    if reg_id is None and email is None:
      return False
    reg_ids = None
    if reg_id is None and email is not None:
      reg_ids = self.get_device_token_by_email(email)
    elif reg_id is not None:
      reg_ids = [reg_id]

    if reg_ids and len(reg_ids) > 0:
      gcm = GCM(self.api_key)
      for device_reg_id in reg_ids:
        self.log.info("Notifying device [%s]" % (device_reg_id))
        try:
          gcm.plaintext_request(registration_id=device_reg_id, data=data)
        except Exception as e:
          self.log.exception(e)
      return True

    return False
