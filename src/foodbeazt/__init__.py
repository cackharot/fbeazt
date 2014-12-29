import os
from urllib import unquote
from uuid import uuid4
from flask import Flask, session, render_template, make_response, request, redirect, g, url_for
from flask_login import login_required, UserMixin, login_user, logout_user, current_user
from flask_mail import Mail
from flask_pymongo import PyMongo
from flask_restful import Api
from pymongo import Connection
from bson import json_util
from werkzeug.utils import secure_filename
from service.ProductService import ProductService
from service.TenantService import TenantService
from service.UserService import UserService
import json
from foodbeazt.libs.flask_googlelogin import GoogleLogin

app = Flask(__name__, instance_relative_config=False)
app.config.from_pyfile('foodbeazt.cfg', silent=False)
if os.environ.get('FOODBEAZT_CONFIG', None):
    app.config.from_envvar('FOODBEAZT_CONFIG')

mongo = PyMongo(app)

api = Api(app)
mail = Mail(app)

# Setup Google Federated Auth
auth = GoogleLogin(app)


@app.route('/oauth2callback')
@auth.oauth2callback
def outhCallback(token, userinfo, **params):
    return create_or_update_user(userinfo)


def create_or_update_user(user_info):
    user = get_or_create_user(user_info)
    user_mixin = getUserMixin(user)
    login_user(user_mixin)
    session['user_id'] = str(user['_id'])
    session['tenant_id'] = str(user['tenant_id'])
    session['name'] = user['name']
    session['email'] = user['email']
    session['roles'] = user.get('roles', ['member'])
    return redirect('/admin')


def getUserMixin(user):
    tenant_id = request.cookies.get('tenant_id', None)
    if not tenant_id:
        tenant_id = user.get('tenant_id', None)
    else:
        tenant_id = unquote(tenant_id).replace('"', '')

    return User(user['_id'], tenant_id, user['name'], user['email'], user['roles'],
                user.get('tenant_id', None), user.get('identity', None))


@auth.user_loader
def get_user(userid):
    service = UserService(mongo.db)
    user = service.get_by_id(userid)
    return getUserMixin(user)


class User(UserMixin):
    def __init__(self, user_id=None, tenant_id=None, name=None, email=None, roles=[], user_tenant_id=None,
                 identity=None):
        self.id = user_id
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.name = name
        self.email = email
        self.roles = roles
        self.user_tenant_id = user_tenant_id
        self.identity = identity

    def is_authenticated(self):
        return self.id is not None

    def is_anonymous(self):
        return self.email == 'guest@foodbeazt.in' or self.email is None


def get_or_create_user(item):
    print(item)
    service = UserService(mongo.db)
    prev = service.get_by_email(item['email'])
    if prev:
        return prev
    print('Creating new user...')
    tenant_id = TenantService(mongo.db).get_by_name("FoodBeazt")['_id']
    user = {'username': item['email'], 'email': item['email'], 'name': item['name'], 'auth_type': 'google',
            'tenant_id': tenant_id, 'roles': ['member'], 'identity': item['id']}
    service.create(user)
    return user


@app.before_request
def set_user_on_request_g():
    if not current_user.is_authenticated():
        create_or_update_user({'email': 'guest@foodbeazt.in', 'name': 'Guest', 'id': 'guest@foodbeazt.in'})
    setattr(g, 'user', current_user)


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


@app.route("/beta")
# @login_required
def beta_home():
    return render_template('home.jinja2')


@app.route("/admin")
@login_required
def admin_home():
    return render_template('admin/index.jinja2')


@app.route('/logout')
@app.route('/logout/')
def app_logout():
    logout_user()
    session.clear()
    return redirect('/admin')


@app.route("/recreatedb")
def recreate_db():
    print('Dropping database(' + app.config['MONGO_DBNAME'] + ')....\n')
    c = Connection()
    c.drop_database(app.config['MONGO_DBNAME'])
    return redirect('/')


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
upload_folder = os.path.join(APP_ROOT, 'static/images/products/')


def allowed_files(filename):
    return '.' in filename and filename.split('.')[1] in ['jpg', 'png', 'gif', 'jpeg', 'bmp']


@app.route("/api/upload_product_image/<string:_id>", methods=['GET', 'POST'])
def upload_product_image(_id):
    service = ProductService(mongo.db)
    item = service.get_by_id(_id)
    if item and request.files and len(request.files) > 0 and request.files['file']:
        if 'image_url' in item and item['image_url']:
            fname = os.path.join(upload_folder, item['image_url'])
            if os.path.isfile(fname):
                os.remove(fname)

        file_body = request.files['file']
        if allowed_files(secure_filename(file_body.filename)):
            filename = secure_filename(str(uuid4()) + "." + file_body.filename.split('.')[1])
            item['image_url'] = filename
            file_body.save(os.path.join(upload_folder, filename))
            service.update(item)
            return json.dumps({"status": "success", "id": _id, "filename": filename})
    return '', 404


from foodbeazt.resources.subscription import SubscriptionApi, SubscriptionListApi
from foodbeazt.resources.tenant import TenantListApi, TenantApi
from foodbeazt.resources.user import UserApi, UserListApi
from foodbeazt.resources.store import StoreApi, StoreListApi
from foodbeazt.resources.product import ProductApi, ProductListApi, ProductActivateApi
from foodbeazt.resources.order import OrderApi, OrderListApi

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

api.add_resource(OrderApi, '/api/order/<string:_id>')
api.add_resource(OrderListApi, '/api/orders/')