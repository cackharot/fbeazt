from flask import Flask, session, render_template, make_response, request, redirect
from flask.ext.pymongo import PyMongo
from flask.ext.restful import Api, Resource
from pymongo import Connection
from bson import json_util
import json
from datetime import datetime
from flask_googleauth import GoogleAuth, login, logout
from fbeazt.service.SubscriptionService import SubscriptionService, InvalidEmailFormatException, DuplicateEmailException
from flask.ext.mail import Mail, Message

app = Flask(__name__, instance_relative_config=False)
app.config.from_pyfile('foodbeazt.cfg', silent=False)

mongo = PyMongo(app)

api = Api(app)
mail = Mail(app)

from resources.store import Store

Store(app, api)


def google_logout(sender, user=None):
    print('logout called.....')
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
        session['roles'] = user['roles']


login.connect(google_login)
logout.connect(google_logout)


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

@app.route("/home")
# @auth.required
def home1():
    name = session.get('name', None)
    return render_template('home.html', name=name)

@app.route("/recreatedb")
def recreate_db():
    print('Dropping database('+app.config['MONGO_DBNAME']+')....\n')
    c = Connection()
    c.drop_database(app.config['MONGO_DBNAME'])
    return redirect('/')


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
            try:
                msg = Message("Thank you for your subscription",
                              sender=(app.config['MAIL_SENDER_NAME'], app.config['MAIL_SENDER']),
                              recipients=[email])
                with app.open_resource("templates/welcome_mail_template.html") as f:
                    msg.html = f.read()
                mail.send(msg)
                return {"status": "success", "data": _id}
            except Exception as e:
                print(e)
                service.delete_by_email(email)
                return {"status": "error", "message": "Oops! Unable to register you now. Kindly check again later!"}, 400
        except InvalidEmailFormatException as ex:
            return {"status": "error", "message": "Invalid email address. Kindly check again!"}, 400
        except DuplicateEmailException as ex:
            return {"status": "error", "message": email + " has been already subscribed!"}, 400


api.add_resource(SubscriptionApi, '/api/subscribe/<string:email>')
api.add_resource(SubscriptionListApi, '/api/subscriptions')