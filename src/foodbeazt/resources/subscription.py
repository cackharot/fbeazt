from datetime import datetime
from flask import request
from service.SubscriptionService import SubscriptionService, InvalidEmailFormatException, DuplicateEmailException
from flask.ext.mail import Message
from foodbeazt import mongo, app, mail
from flask.ext.restful import Resource


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
