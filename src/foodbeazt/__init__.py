from flask import Flask, session, render_template, make_response, request, redirect, g
from flask_mail import Mail
from flask_pymongo import PyMongo
from flask_restful import Api
from pymongo import Connection
from bson import json_util
from flask_googleauth import GoogleAuth, login, logout
from fbeazt.service.TenantService import TenantService
from fbeazt.service.UserService import UserService
import json

app = Flask(__name__, instance_relative_config=False)
app.config.from_pyfile('foodbeazt.cfg', silent=False)

mongo = PyMongo(app)

api = Api(app)
mail = Mail(app)

# Setup Google Federated Auth
auth = GoogleAuth(app)


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
        session['tenant_id'] = str(user['tenant_id'])
        session['name'] = user['name']
        session['email'] = user['email']
        session['roles'] = user.get('roles', ['member'])


login.connect(google_login)
logout.connect(google_logout)


class User(object):
    def __init__(self, user_id=None, tenant_id=None, name=None, email=None, roles=[], user_tenant_id=None,
                 identity=None):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.name = name
        self.email = email
        self.roles = roles
        self.user_tenant_id = user_tenant_id
        self.identity = identity


@app.before_request
def set_user_on_request_g():
    if 'user_id' not in session:
        return
    setattr(g, 'user',
            User(session['user_id'], session['tenant_id'], session['name'], session['email'], session['roles'],
                 session.get('user_tenant_id', None), session.get('identity', None)))


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
    d = json.dumps(data, default=json_util.default)
    resp = make_response(d, code)
    resp.headers.extend(headers or {})
    return resp


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
from foodbeazt.resources.tenant import TenantListApi, TenantApi
from foodbeazt.resources.user import UserApi, UserListApi
from foodbeazt.resources.store import StoreApi, StoreListApi
from foodbeazt.resources.product import ProductApi, ProductListApi, ProductActivateApi

api.add_resource(SubscriptionApi, '/api/subscribe/<string:email>')
api.add_resource(SubscriptionListApi, '/api/subscriptions')

api.add_resource(TenantApi, '/api/tenant/<string:_id>')
api.add_resource(TenantListApi, '/api/tenants')

api.add_resource(UserApi, '/api/user/<string:_id>')
api.add_resource(UserListApi, '/api/users')

api.add_resource(StoreApi, '/api/store/<string:_id>')
api.add_resource(StoreListApi, '/api/stores')

api.add_resource(ProductApi, '/api/product/<string:store_id>/<string:_id>')
api.add_resource(ProductActivateApi, '/api/product/activate/<string:store_id>/<string:_id>')
api.add_resource(ProductListApi, '/api/products/<string:store_id>')