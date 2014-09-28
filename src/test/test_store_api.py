import unittest
from pymongo import MongoClient
from fbeazt.service.StoreService import StoreService


class test_store_api(unittest.TestCase):

    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.service = StoreService(self.db)
        pass

    def test_create_store(self):
        store_item = {'name': 'The great restaurant', 'description': 'some desc', 'address': 'some address',
                      'contact_name': 'contact person name', 'contact_email': 'contact person email',
                      'contact_phone': 'contact person phone', 'website': 'website'}
        id = self.service.save(store_item)
        assert id is not None
        return id

    def test_get_all_stores(self):
        stores = self.service.search()
        assert len(stores) >= 1

    def test_delete_store_by_id(self):
        id = self.test_create_store()
        self.service.delete(str(id))