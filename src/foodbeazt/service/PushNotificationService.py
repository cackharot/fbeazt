from datetime import datetime
import logging

from gcm import *


class PushNotificationService(object):

    def __init__(self, db, api_key):
        self.log = logging.getLogger(__name__)
        self.api_key = api_key
        self.push_notify_store = db.push_notify_collection
        self.gcm = None
        if self.api_key is not None and self.api_key != "False" and len(self.api_key) > 3:
            self.gcm = GCM(self.api_key)

    def search(self):
        lst = self.push_notify_store.find({}).sort("created_at", -1)
        return [x for x in lst]

    def get_device_token_by_email(self, email):
        lst = self.push_notify_store.find({'email': email})
        return [x['device_token'] for x in lst]

    def save(self, item):
        email = item['email']
        # device_token = item['device_token']
        # ,'device_token':device_token})
        cnt = self.delete_by_registered_email(email)
        self.log.info("Deleting previous device token, count %s", cnt)
        item['created_at'] = datetime.now()
        return self.push_notify_store.save(item)

    def delete_by_device_token(self, device_token):
        return self.push_notify_store.remove({
            device_token: device_token
        })

    def delete_by_registered_email(self, email):
        return self.push_notify_store.remove({
            email: email
        })

    def send_to_device(self, data, reg_id=None, email=None):
        if self.gcm is None:
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
            for device_reg_id in reg_ids:
                self.log.info("Notifying device (%s) [%s]" % (
                    email, device_reg_id))
                try:
                    self.gcm.plaintext_request(
                        registration_id=device_reg_id, data=data)
                except Exception as e:
                    self.log.exception(e)
                    if "Registration id is not valid anymore" in e.message:
                      self.delete_by_registered_email(email)
            return True
        else:
            self.log.info("No device registered for %s" % (email))
        return False
