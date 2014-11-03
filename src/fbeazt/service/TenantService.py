from datetime import datetime
from bson import ObjectId
from fbeazt.service.UserService import UserService, DuplicateUserException


class DuplicateTenantNameException(Exception):
    def __init__(self, message='Tenant name already exits'):
        Exception.__init__(self, message)
    pass


class DuplicateTenantUrlException(Exception):
    def __init__(self, message='Tenant url already exits'):
        Exception.__init__(self, message)
    pass


class TenantService(object):
    def __init__(self, db):
        self.db = db
        self.tenants = self.db.tenant_collection
        self.user_service = UserService(db)

    def create(self, item):
        if self.check_name_exists(None, item['name']):
            raise DuplicateTenantNameException()

        if self.check_url_exists(None, item['url']):
            raise DuplicateTenantUrlException()

        item.pop("_id", None)
        item['created_at'] = datetime.now()
        item['status'] = True
        _id = self.tenants.insert(item)

        try:
            user = {"name": item['contact']['name'], "username": item['contact']['email'],
                    "email": item['contact']['email'],
                    "auth_type": "google", "tenant_id": _id, "registered_ip": item['registered_ip'],
                    "roles": ["tenant_admin"]}

            self.user_service.create(user)
        except DuplicateUserException as e:
            self.tenants.remove({'_id': _id})
            raise e

        return _id

    def update(self, item):
        if item['_id'] is None:
            raise Exception("Invalid input. Should have a valid _id")
        if self.check_name_exists(item['_id'], item['name']):
            raise DuplicateTenantNameException()
        if self.check_url_exists(item['_id'], item['url']):
            raise DuplicateTenantUrlException()

        item['updated_at'] = datetime.now()
        return self.tenants.save(item)

    def check_name_exists(self, id, name):
        query = {'name': name}
        if id:
            query['_id'] = {"$ne": ObjectId(id)}
        return self.tenants.find(query).count() > 0

    def check_url_exists(self, id, url):
        query = {'url': url}
        if id:
            query['_id'] = {"$ne": ObjectId(id)}
        return self.tenants.find(query).count() > 0

    def get_by_name(self, name):
        return self.tenants.find_one({'name': name})

    def get_by_url(self, url):
        return self.tenants.find_one({'url': url})

    def search(self, tenant_id=None):
        query = {}
        if tenant_id:
            query['tenant_id'] = ObjectId(tenant_id)

        return [x for x in self.tenants.find(query).sort("created_at", -1)]

    def get_by_id(self, _id):
        return self.tenants.find_one({'_id': ObjectId(_id)})