from bson import ObjectId
from flask import Blueprint, render_template, abort, request, g, session, url_for, make_response
from foodbeazt import mongo
from flask.ext.restful import Resource


class Store(object):
    def __init__(self, app=None, api=None, url_prefix='/store'):
        self.app = app
        self.url_prefix = url_prefix
        self.blueprint = Blueprint('store', __name__)
        a = self.blueprint
        a.add_url_rule('/', 'index', self._index, methods=["GET"])

        self.init_app(app, api, url_prefix)


    def init_app(self, app, api, url_prefix='/store'):
        self.app = app
        self.url_prefix = url_prefix
        self.app.register_blueprint(self.blueprint, url_prefix=url_prefix)

        api.add_resource(StoreListApi, '/api/stores')
        api.add_resource(StoreApi, '/api/store/<id>')

    def _index(self):
        model = []
        return render_template('stores.html', model=model)


class StoreListApi(Resource):
    def get(self):
        lst = [x for x in mongo.db.stores.find()]
        return lst


class StoreApi(Resource):
    def get(self, id):
        return mongo.db.stores.find_one({'_id': ObjectId(id)})

    def put(self, id):
        return None, 204

    def post(self, id):
        return None

    def delete(self, id):
        return None, 204