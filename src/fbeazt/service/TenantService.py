from datetime import datetime
from bson import ObjectId


class DuplicateTenantNameException(Exception):
    pass


class DuplicateTenantUrlException(Exception):
    pass


class TenantService(object):
    def __init__(self, db):
        self.db = db
        self.tenants = self.db.tenant_collection

    def create(self, item):
        if self.check_name_exists(None, item['name']):
            raise DuplicateTenantNameException()

        if self.check_url_exists(None, item['url']):
            raise DuplicateTenantUrlException()

        item['created_at'] = datetime.now()
        item['status'] = True
        return self.tenants.insert(item)

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
        query = self.tenants.find({'name': name})
        if id:
            query = query.find({'_id': -ObjectId(id)})
        return query.count() > 0

    def check_url_exists(self, id, url):
        query = self.tenants.find({'url': url})
        if id:
            query = query.find({'_id': -ObjectId(id)})
        return query.count() > 0

    def get_by_name(self, name):
        return self.tenants.find_one({'name': name})

    def get_by_url(self, url):
        return self.tenants.find_one({'url': url})