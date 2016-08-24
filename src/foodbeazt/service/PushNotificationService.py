from datetime import datetime
from bson import ObjectId

class PushNotificationService(object):
  def __init__(self, db):
    self.db = db
    self.push_notify_store = self.db.push_notify_collection

  def search(self):
    lst = self.push_notify_store.find({}).sort("created_at", -1)
    return [x for x in lst]

  def get_device_token_by_email(self, email):
    lst = self.push_notify_store.find({'email':email})
    return [x for x in lst]

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
