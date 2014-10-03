from flask import Flask, session, render_template, make_response, request, redirect
from flask_mail import Mail
from flask_pymongo import PyMongo
from flask_restful import Api
from pymongo import Connection
from bson import json_util
from flask_googleauth import GoogleAuth, login, logout
from fbeazt.service.TenantService import TenantService
from fbeazt.service.UserService import UserService
from foodbeazt.resources.store import Store
import json

app = Flask(__name__, instance_relative_config=False)
app.config.from_pyfile('foodbeazt.cfg', silent=False)

mongo = PyMongo(app)

api = Api(app)
mail = Mail(app)

Store(app, api, mongo)


def google_logout(sender, user=None):
    if request and 'user_id' in session:
        session.pop('user_id')
        session.pop('name')
        session.pop('email')
        session.pop('roles')
    pass


def google_login(sender, user=None):
    if request and 'openid' in session:
        user = get_or_create_user(session['openid'])
        session['user_id'] = str(user['_id'])
        session['name'] = user['name']
        session['email'] = user['email']
        session['roles'] = user.get('roles', ['member'])


login.connect(google_login)
logout.connect(google_logout)


def get_or_create_user(item):
    service = UserService(mongo.db)
    prev = service.get_by_email(item['email'])
    if prev:
        return prev
    print('Creating new user...')
    tenant_id = TenantService(mongo.db).get_by_name("FoodBeazt")['_id']
    user = {'username': item['email'], 'email': item['email'], 'name': item['name'], 'auth_type': 'google',
            'tenant_id': tenant_id, 'roles': ['member'], 'identity': item['identity']}
    service.create(user)
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
    return render_template('launch_home.jinja2', name=name)


@app.route("/admin")
@auth.required
def admin_home():
    return render_template('admin/index.jinja2')


@app.route("/recreatedb")
def recreate_db():
    print('Dropping database(' + app.config['MONGO_DBNAME'] + ')....\n')
    c = Connection()
    c.drop_database(app.config['MONGO_DBNAME'])
    return redirect('/')


from foodbeazt.resources.subscription import SubscriptionApi, SubscriptionListApi

api.add_resource(SubscriptionApi, '/api/subscribe/<string:email>')
api.add_resource(SubscriptionListApi, '/api/subscriptions')