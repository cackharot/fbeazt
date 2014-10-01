import random
import unittest
from pymongo import MongoClient
from fbeazt.service.TenantService import TenantService, DuplicateTenantNameException, DuplicateTenantUrlException


class test_tenant_service(unittest.TestCase):
    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.db.tenant_collection.drop()
        self.service = TenantService(self.db)

    def get_model(self, name):
        item = {"name": name, "description": "some desc", "website": "www.testtenant.com",
                "url": name + ".foodbeazt.in", "type": "smb", "logo": "logo1.png",
                "contact": {"name": "testname", "email": "testname@somemail.com", "phone": "1234567"},
                "address": {"address": "some address", "zipcode": "1234", "country": "INDIA", "state": "Tamil Nadu"}}
        return item

    def test_create_tenant(self):
        no = str(random.randint(1, 1234))
        name = "test_tenant_" + no
        item = self.get_model(name)

        _id = self.service.create(item)
        assert _id is not None

    def test_duplicate_tenant_name(self):
        name = 'The great ' + str(random.randint(1, 12341))
        store_item = self.get_model(name)
        id = self.service.create(store_item)
        assert id is not None

        try:
            item = self.get_model(name)
            self.service.create(item)
            assert False
        except DuplicateTenantNameException as e:
            assert True

    def test_duplicate_tenant_url(self):
        name = 'The great ' + str(random.randint(1, 12341))
        store_item = self.get_model(name)
        id = self.service.create(store_item)
        assert id is not None

        try:
            item = self.get_model(name)
            item['name'] += "123"
            self.service.create(item)
            assert False
        except DuplicateTenantUrlException as e:
            assert True

    def test_get_tenant_by_name(self):
        name = "test_tenant_1"
        item = self.service.get_by_name(name)
        if not item:
            item = self.get_model(name)
            _id = self.service.create(item)
            assert _id is not None
            item = self.service.get_by_name(name)

        assert item is not None
        assert item['name'] == name

    def test_get_tenant_by_url(self):
        item = self.service.get_by_url("test_tenant_1.foodbeazt.in")
        if item:
            assert item['url'] == "test_tenant_1.foodbeazt.in"