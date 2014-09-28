from flask import Flask, session, render_template, make_response, request
from flask.ext.pymongo import PyMongo
from flask.ext.restful import Api, Resource
from pymongo import Connection
from bson import json_util
import json
from datetime import datetime
from flask_googleauth import GoogleAuth
from fbeazt.service.SubscriptionService import SubscriptionService, InvalidEmailFormatException, DuplicateEmailException

app = Flask(__name__)
app.secret_key = "Amdk134/20Sdf1#@$2sdjd"

app.config["MONGO_DBNAME"] = "foodbeaztDb"

mongo = PyMongo(app)

api = Api(app)

from resources.store import Store

Store(app, api)


@app.before_first_request
def recreate_db():
    print('Dropping database....\n')
    c = Connection()
    c.drop_database('foodbeaztDb')


@app.before_first_request
def setup_test_users():
    print('\nCreating Test data...')
    pass


def valid_url():
    return not request.path.startswith('/static')


@app.before_request
def setup_login_user():
    if not valid_url():
        return
    if not 'user_id' in session:
        if 'openid' in session:
            user = get_or_create_user(session['openid'])
            session['user_id'] = str(user['_id'])
            session['name'] = user['name']
            session['email'] = user['email']
            session['roles'] = user['roles']


def get_or_create_user(item):
    prev = mongo.db.users.find_one({'email': item['email']})
    if prev:
        return prev
    print('Creating new user...')
    user = {'username': item['email'], 'email': item['email'], 'name': item['name'], 'auth_type': 'google',
            'created_at': datetime.now(), 'status': True, 'roles': ['member']}
    mongo.db.users.save(user)
    return user


@api.representation('application/json')
def mjson(data, code, headers=None):
    resp = make_response(json.dumps(data, default=json_util.default), code)
    resp.headers.extend(headers or {})
    return resp

# Setup Google Federated Auth
auth = GoogleAuth(app)


@app.route("/")
# @auth.required
def home():
    name = session.get('name', None)
    return render_template('home.html', name=name)


class SubscriptionListApi(Resource):
    def get(self):
        service = SubscriptionService(mongo.db)
        return service.search()


class SubscriptionApi(Resource):
    def post(self, email):
        if email is None or len(email) < 3:
            return {"status": "error", "message": "Invalid email address. Kindly check again!"}, 400
        try:
            item = {'email': email, 'created_at': datetime.now(), 'ip': request.remote_addr,
                    'user_agent': request.user_agent.string}
            service = SubscriptionService(mongo.db)
            _id = service.add(item)
            return {"status": "success", "data": _id}
        except InvalidEmailFormatException as ex:
            return {"status": "error", "message": "Invalid email address. Kindly check again!"}, 400
        except DuplicateEmailException as ex:
            return {"status": "error", "message": email + " has been already subscribed!"}, 400


api.add_resource(SubscriptionApi, '/api/subscribe/<string:email>')
api.add_resource(SubscriptionListApi, '/api/subscriptions')