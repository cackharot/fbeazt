import random
import unittest
from pymongo import MongoClient
from fbeazt.service.StoreService import StoreService, DuplicateStoreNameException


class test_store_service(unittest.TestCase):
    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.db.store_collection.drop()
        self.service = StoreService(self.db)
        pass

    def get_model(self, name):
        store_item = {'name': name, 'description': 'some desc', 'address': 'some address',
                      'contact_name': 'contact person name', 'contact_email': 'contact person email',
                      'contact_phone': 'contact person phone', 'website': 'website'}
        return store_item

    def test_create_store(self):
        name = 'The great restaurant ' + str(random.randint(1, 12341))
        store_item = self.get_model(name)
        id = self.service.save(store_item)
        assert id is not None
        return id

    def test_duplicate_store_name(self):
        name = 'The great restaurant ' + str(random.randint(1, 12341))
        store_item = self.get_model(name)
        id = self.service.save(store_item)
        assert id is not None

        try:
            item = self.get_model(name)
            self.service.save(item)
            assert False
        except DuplicateStoreNameException as e:
            assert True

    def test_get_store_by_name(self):
        name = "The Gateway"
        store_item = self.get_model(name)
        id = self.service.save(store_item)
        assert id is not None
        item = self.service.get_by_name(name)
        assert item['name'] == name

    def test_get_all_stores(self):
        self.test_create_store()
        stores = self.service.search()
        assert len(stores) >= 1

    def test_delete_store_by_id(self):
        id = self.test_create_store()
        self.service.delete(str(id))