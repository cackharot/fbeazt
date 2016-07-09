from datetime import datetime
from flask import g, request
from service.ImportExportService import ImportExportService
from flask.ext.restful import Resource
from foodbeazt.fapp import mongo, app, mail, export_data_folder, import_data_folder


class ExportDataApi(Resource):
    def get(self):
        tenant_id = g.user.tenant_id
        service = ImportExportService(mongo.db)
        return service.search(tenant_id)

    def post(self):
        try:
            tenant_id = g.user.tenant_id
            service = ImportExportService(mongo.db)
            service.export(tenant_id, export_data_folder)
        except Exception as ex:
            return {"status": "error", "message": ex}, 400
