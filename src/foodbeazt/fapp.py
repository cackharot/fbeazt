import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from urllib.parse import unquote
from uuid import uuid4
from flask import Flask, session, render_template, send_file, make_response, request, redirect, g, current_app, flash
from flask_login import login_required, UserMixin, login_user, logout_user, current_user
from flask_mail import Mail
from flask_pymongo import PyMongo
from flask_restful import Api
from flask_babel import Babel
from flask_pymongo import MongoClient
from werkzeug.utils import secure_filename
from service.ProductService import ProductService
from service.StoreService import StoreService
from service.TenantService import TenantService
from service.UserService import UserService
from libs.flask_googlelogin import GoogleLogin
from flask_principal import Principal, Permission, Identity, AnonymousIdentity
from flask_principal import identity_loaded, identity_changed, RoleNeed, UserNeed
from flask_cors import CORS, cross_origin
from bson import ObjectId, json_util
import json
import pdfkit

from oauth2client import client, crypt

from flogging import logging, setup_logging

setup_logging()

logger = logging.getLogger(__name__)

logger.info("Starting flask app...")
app = Flask(__name__, instance_relative_config=False)
app.config.from_pyfile('foodbeazt.cfg', silent=True)

if os.environ.get('FOODBEAZT_CONFIG', None) is not None:
  logger.info("Loading config from %(logfile)s",{ 'logfile': os.environ.get('FOODBEAZT_CONFIG')})
  app.config.from_envvar('FOODBEAZT_CONFIG')

logger.info("Setup CORS")
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

logger.info("Setup Mongodb")
mongo = PyMongo(app)

logger.info("Setup REST API")
api = Api(app)

logger.info("Setup EMAIL")
mail = Mail(app)

# Setup Google Federated Auth
auth = GoogleLogin(app)


# load the extension
principals = Principal(app)

# Create a permission with a single Need, in this case a RoleNeed.
admin_permission = Permission(RoleNeed('tenant_admin'))


# localization
logger.info("Setup Babel")
babel = Babel(app)

@babel.localeselector
def get_locale():
  return g.get('current_lang', 'en')

@app.route('/oauth2callback')
@auth.oauth2callback
def outhCallback(token, userinfo, **params):
  create_or_update_user(userinfo)
  return redirect('/admin')


@identity_loaded.connect_via(app)
def on_identity_loaded(sender, identity):
  # Set the identity user object
  identity.user = current_user

  # Add the UserNeed to the identity
  if hasattr(current_user, 'id'):
    identity.provides.add(UserNeed(current_user.id))

  # Assuming the User model has a list of roles, update the
  # identity with the roles that the user provides
  if hasattr(current_user, 'roles'):
    for role in current_user.roles:
      identity.provides.add(RoleNeed(role))

def create_or_update_user(user_info):
  user = get_or_create_user(user_info)
  user_mixin = getUserMixin(user)
  login_user(user_mixin)
  # Tell Flask-Principal the identity changed
  identity_changed.send(current_app._get_current_object(), identity=Identity(str(user_mixin.id)))
  return user_mixin

def login_anonymous():
  return create_or_update_user({
            'id': 'guest@foodbeazt.in',
            'name': 'Guest',
            'email': 'guest@foodbeazt.in',
            'roles': ['member']
          })

def getUserMixin(user):
  if user is None: return None
  tenant_id = request.cookies.get('tenant_id', None)
  if not tenant_id:
    tenant_id = user.get('tenant_id', None)
  else:
    tenant_id = unquote(tenant_id).replace('"', '')
  return User(user['_id'], tenant_id, user['name'], user['email'], user['roles'],
              user.get('tenant_id', None), user.get('identity', None))

def default_tenantId():
  return TenantService(mongo.db).get_by_name("FoodBeazt")['_id']

def get_or_create_user(item):
  service = UserService(mongo.db)
  email = item['email']
  prev = service.get_by_email(email)
  if prev:
    return prev
  self.log.info("Creating new user...[%s]" % email)

  tenant_id = default_tenantId()

  if email == "cackharot@gmail.com":
    roles = ["tenant_admin", 'member']
  else:
    roles = ["member"]

  user = {
          'username': email,
          'email': email,
          'name': item['name'],
          'auth_type': 'google',
          'tenant_id': tenant_id,
          'roles': roles,
          'identity': item.get('id', item.get('sub', None))
         }
  service.create(user)
  return user

@auth.user_loader
def get_user(userid):
  if request and request.path.startswith('/static/'):
    return None
  user = UserService(mongo.db).get_by_id(userid)
  return getUserMixin(user)

def login_via_google_token(token):
  if token == 'null': return None
  try:
    idinfo = client.verify_id_token(token, auth.client_id)
    if idinfo['aud'] not in [auth.client_id]:
      raise crypt.AppIdentityError("Unrecognized client.")
    if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
      raise crypt.AppIdentityError("Wrong issuer.")
    if 'hd' in idinfo and idinfo['hd'] not in ['foodbeazt.in','localhost']:
      raise crypt.AppIdentityError("Wrong hosted domain.")
    return getUserMixin(get_or_create_user(idinfo))
  except crypt.AppIdentityError as e:
    logger.exception(e)
  return None

@auth.request_loader
def request_loader(request):
  if request and request.path.startswith('/static/'):
    return None
  user_mixin = None
  userService = UserService(mongo.db)
  authHeader =  request.headers.get('Authorization', None)
  if authHeader and len(authHeader) > 0:
    if authHeader.startswith('Bearer '):
      user_mixin = login_via_google_token(authHeader.replace('Bearer ', ''))
  if user_mixin is None and session and session.get('identity.id', None) is not None:
    userid = str(session['identity.id'])
    user_mixin = getUserMixin(userService.get_by_id(userid))
  if user_mixin:
    login_user(user_mixin)
    identity_changed.send(current_app._get_current_object(), identity=Identity(str(user_mixin.id)))
    return user_mixin
  # print("Anonymous login initiated############### %s" % (request.path))
  return login_anonymous()

class User(UserMixin):
  def __init__(self, user_id=None, tenant_id=None, name=None, email=None,
                roles=[], user_tenant_id=None,
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
    return not self.is_anonymous()

  def is_anonymous(self):
    return self.email in [None, "-1", "", 'guest@foodbeazt.in']

@app.before_request
def set_user_on_request_g():
  setattr(g, 'user', current_user)


@api.representation('application/json')
def mjson(data, code, headers=None):
  d = json.dumps(data, default=json_util.default)
  resp = make_response(d, code)
  resp.headers.extend(headers or {})
  return resp


@app.route("/")
def home():
  return redirect('/admin')
  #name = session.get('name', None)
  #return render_template('launch_home.jinja2', name=name)

@app.route("/test_order_email")
def test_order_email():
  tenant_id = g.user.tenant_id
  query = {'tenant_id': ObjectId(tenant_id)}
  order = [x for x in mongo.db.order_collection.find(query).sort("created_at", -1)][0]
  return render_template("email/order_created.html", order=order)

@app.route("/test_order_delivered")
def test_order_delivered():
  tenant_id = g.user.tenant_id
  query = {'tenant_id': ObjectId(tenant_id),'status':'DELIVERED'}
  order = [x for x in mongo.db.order_collection.find(query).sort("created_at", -1)][0]
  return render_template("email/order_delivered.html", order=order)

@app.route("/admin")
@login_required
def admin_home():
  if not admin_permission.can():
    doLogout()
    return "You are unauthorized to access this page! Sorry :(", 403
  return render_template('admin/index.jinja2')


@app.route('/logout')
@app.route('/logout/')
def app_logout():
    doLogout()
    return redirect('/')

def doLogout():
  logout_user()
  # Tell Flask-Principal the user is anonymous
  identity_changed.send(current_app._get_current_object(), identity=AnonymousIdentity())
  session.clear()

# @app.route("/recreatedb")
# def recreate_db():
#     print('Dropping database(' + app.config['MONGO_DBNAME'] + ')....\n')
#     c = Connection()
#     c.drop_database(app.config['MONGO_DBNAME'])
#     return redirect('/')


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
export_data_folder = os.path.join(APP_ROOT, 'uploads', 'export')
import_data_folder = os.path.join(APP_ROOT, 'uploads', 'import')
product_upload_folder = os.path.join(APP_ROOT, 'static/images/products/')
store_upload_folder = os.path.join(APP_ROOT, 'static/images/stores/')
invoice_emails_folder = os.path.join(APP_ROOT, 'invoice_emails')

@app.route("/test_order_invoice")
def test_order_invoice():
  tenant_id = g.user.tenant_id
  query = {'tenant_id': ObjectId(tenant_id),'status':'DELIVERED'}
  order = [x for x in mongo.db.order_collection.find(query).sort("created_at", -1)][0]

  try:
    config = pdfkit.configuration(wkhtmltopdf='/usr/local/bin/wkhtmltopdf'.encode('utf-8'))
    html_text = render_template("email/order_invoice.html", order=order)
    output_filename = os.path.join(invoice_emails_folder, "Invoice-%s.pdf" % (order['order_no']))
    pdfkit.from_string(html_text, output_filename, configuration=config)
    return send_file(output_filename,mimetype='application/pdf')
  except Exception as e:
    logger.exception(e)
    return "Error in generating PDF invoice"

def allowed_files(filename):
  return '.' in filename and filename.split('.')[1] in ['jpg', 'png', 'gif', 'jpeg', 'bmp']

@app.route("/api/upload_product_image/<string:_id>", methods=['GET', 'POST'])
def upload_product_image(_id):
  service = ProductService(mongo.db)
  item = service.get_by_id(_id)
  if item and request.files and len(request.files) > 0 and request.files['file']:
    if 'image_url' in item and item['image_url']:
      fname = os.path.join(product_upload_folder, item['image_url'])
      if os.path.isfile(fname):
        os.remove(fname)

    file_body = request.files['file']
    if allowed_files(secure_filename(file_body.filename)):
      filename = secure_filename(str(uuid4()) + "." + file_body.filename.split('.')[1])
      item['image_url'] = filename
      file_body.save(os.path.join(product_upload_folder, filename))
      service.update(item)
      return json.dumps({"status": "success", "id": _id, "filename": filename})
  return '', 404

@app.route("/api/upload_store_image/<string:_id>", methods=['GET', 'POST'])
def upload_store_image(_id):
  service = StoreService(mongo.db)
  item = service.get_by_id(_id)
  if item and request.files and len(request.files) > 0 and request.files['file']:
    if 'image_url' in item and item['image_url']:
      fname = os.path.join(store_upload_folder, item['image_url'])
      if os.path.isfile(fname):
        os.remove(fname)

    file_body = request.files['file']
    if allowed_files(secure_filename(file_body.filename)):
      filename = secure_filename(str(uuid4()) + "." + file_body.filename.split('.')[1])
      item['image_url'] = filename
      file_body.save(os.path.join(store_upload_folder, filename))
      service.save(item)
      return json.dumps({"status": "success", "id": _id, "filename": filename})
  return '', 404

@app.template_filter('datetime')
def _jinja2_filter_datetime(value, fmt=None):
  if value is None:
    return ''
  if fmt is None or len(fmt) == 0:
    fmt='%b %d, %Y %H:%m'
  return value.strftime(fmt)

from foodbeazt.resources.subscription import SubscriptionApi, SubscriptionListApi
from foodbeazt.resources.tenant import TenantListApi, TenantApi
from foodbeazt.resources.user import UserApi, UserListApi
from foodbeazt.resources.store import StoreApi, StoreListApi
from foodbeazt.resources.product import ProductApi, ProductListApi, ProductActivateApi
from foodbeazt.resources.order import OrderApi, TrackOrderApi
from foodbeazt.resources.order_list import OrderListApi
from foodbeazt.resources.order_status import OrderStatusApi
from foodbeazt.resources.export_data import ExportDataApi
from foodbeazt.resources.popular_items import PopularItemsApi
from foodbeazt.resources.sms import SmsApi
from foodbeazt.resources.report import ReportApi
from foodbeazt.resources.pincodes import PincodeListApi, PincodeApi
from foodbeazt.resources.myorders import MyOrdersApi

api.add_resource(MyOrdersApi, '/api/my_orders')

api.add_resource(ReportApi, '/api/reports/orders')

api.add_resource(SmsApi, '/api/sms')

api.add_resource(PincodeListApi, '/api/pincodes')
api.add_resource(PincodeApi, '/api/pincode/<string:_id>')

api.add_resource(PopularItemsApi, '/api/popular_items/<string:_id>')

api.add_resource(ExportDataApi, '/api/data_manage')

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
api.add_resource(TrackOrderApi, '/api/track/<string:order_no>')
api.add_resource(OrderStatusApi, '/api/order_status/<string:_id>')

from views.payment import PaymentListApi, PaymentRedirectView, PaymentSuccessView, PaymentWebHookView

api.add_resource(PaymentListApi, '/api/payments')

app.add_url_rule('/api/payment/order', view_func=PaymentRedirectView.as_view('payment_redirect'))
app.add_url_rule('/api/payment/success', view_func=PaymentSuccessView.as_view('payment_success'))
app.add_url_rule('/api/payment/failure', view_func=PaymentSuccessView.as_view('payment_failure'))
app.add_url_rule('/api/payment/hook', view_func=PaymentWebHookView.as_view('payment_webhook'))
