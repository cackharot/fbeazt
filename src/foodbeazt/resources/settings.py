from datetime import datetime
from bson import ObjectId, json_util
from flask import request
from service.SettingsService import SettingsService
from flask.ext.mail import Message
from flask.ext.restful import Resource
from foodbeazt.fapp import mongo, admin_permission
import logging


class SettingsApi(Resource):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.service = SettingsService(mongo.db)

    def get(self):
        try:
            data = self.service.get()
            if data is None:
                data = {
                    'delivery_disabled': False,
                    'delivery_hours': '',
                    'disable_app_versions': '',
                    'delivery_disabled_reason': ''
                }
            return data
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Unable to fetch settings"}, 434

    def post(self):
        if not admin_permission.can():
            return "Unauthorized", 403
        data = json_util.loads(request.data.decode('utf-8'))
        delivery_disabled = str(data.get('delivery_disabled', 'false')).lower() == 'true'
        delivery_hours = data.get('delivery_hours', None)
        disable_app_versions = data.get('disable_app_versions', [])
        delivery_disabled_reason = data.get('delivery_disabled_reason', '')
        item = {
            'delivery_disabled': delivery_disabled,
            'delivery_hours': delivery_hours,
            'disable_app_versions': disable_app_versions,
            'delivery_disabled_reason': delivery_disabled_reason
        }
        try:
            self.service.save(item)
            return {"status": "success"}, 200
        except Exception as e:
            self.log.exception(e)
            return {"status": "error", "message": "Unable to save settings"}, 434
