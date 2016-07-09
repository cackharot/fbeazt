from datetime import datetime
from flask import g, request
from service.ImportExportService import ImportExportService
from flask.ext.restful import Resource
from foodbeazt.fapp import mongo, app, mail, export_data_folder, import_data_folder
import logging


class ExportDataApi(Resource):
  def __init__(self):
    self.log = logging.getLogger(__name__)

  def get(self):
    try:
      tenant_id = g.user.tenant_id
      service = ImportExportService(mongo.db)
      return service.search(tenant_id)
    except Exception as e:
      self.log.exception(e)
    return {"status":"error","message":"Error while search data"}, 470

  def post(self):
    try:
      tenant_id = g.user.tenant_id
      service = ImportExportService(mongo.db)
      service.export(tenant_id, export_data_folder)
    except Exception as e:
      self.log.exception(e)
      return {"status": "error", "message": "Error while exporting data"}, 471
