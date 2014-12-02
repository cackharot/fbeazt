import random
import unittest
from pymongo import MongoClient
from service.UserService import UserService, DuplicateUserException


class test_user_service(unittest.TestCase):
    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.db.user_collection.drop()
        self.service = UserService(self.db)

    def get_model(self, email):
        item = {"name": "test", "username": email, "email": email, "auth_type": "google",
                "registered_ip": "10.0.0.1"}
        return item

    def test_create_user(self):
        no = str(random.randint(1, 10000))
        item = self.get_model("test" + no + "@test.com")
        id = self.service.create(item)
        assert id is not None
        return id

    def test_duplicate_user(self):
        item = self.get_model("test@test.com")
        self.service.create(item)
        try:
            self.service.create(item)
            assert False
        except DuplicateUserException as e:
            assert True

    def test_get_user_by_email(self):
        item = self.get_model("test@test.com")
        self.service.create(item)
        item = self.service.get_by_email("test@test.com")
        assert item is not None
        assert item["email"] == "test@test.com"

    def test_get_all_users(self):
        self.test_create_user()
        items = self.service.search()
        assert items is not None
        assert len(items) > 0

    def test_delete_user(self):
        id = self.test_create_user()
        self.service.delete(str(id))

    def test_update_user(self):
        id = self.test_create_user()
        item = self.test_get_by_id(str(id))
        item['name'] = "updated test name"
        item = self.service.update(item)
        assert item is not None
        assert item['name'] == 'updated test name'
        assert 'updated_at' in item

    def test_get_by_id(self, id=None):
        if not id:
            id = self.test_create_user()
        item = self.service.get_by_id(id)
        assert item is not None
        return item

