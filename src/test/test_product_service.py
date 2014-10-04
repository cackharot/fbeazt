import random
import unittest
from bson import ObjectId
from pymongo import MongoClient
from fbeazt.service.ProductService import ProductService


class test_product_service(unittest.TestCase):
    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.db.product_collection.drop()
        self.service = ProductService(self.db)
        self.tenant_id = ObjectId()
        self.store_id = ObjectId()
        pass

    def get_model(self, name):
        item = {'name': name, 'description': 'some desc abt product',
                'barcode': '1234', 'status': True, 'type': 'veg', 'discount': 0.0,
                'sell_price': 130.0, 'buy_price': 80.0, 'tenant_id': self.tenant_id,
                'store_id': self.store_id, 'image_url': '/static/images/product/1.png', 'tags': 'food'}
        return item

    def test_create_product(self):
        name = 'Item ' + str(random.randint(1, 12341))
        item = self.get_model(name)
        id = self.service.create(item)
        assert id is not None
        return id

    def test_update_product(self):
        name = 'Item ' + str(random.randint(1, 12341))
        item = self.get_model(name)
        id = self.service.create(item)
        assert id is not None
        name = 'Item ' + str(random.randint(1, 12341))
        item['name'] = name
        self.service.update(item)
        item = self.service.get_by_id(id)
        assert item['name'] == name

    def test_get_product_by_id(self):
        name = 'Item ' + str(random.randint(1, 12341))
        item = self.get_model(name)
        id = self.service.create(item)
        assert id is not None
        item = self.service.get_by_id(id)
        assert item['name'] == name

    def test_get_product_by_name(self):
        name = 'Item ' + str(random.randint(1, 12341))
        item = self.get_model(name)
        id = self.service.create(item)
        assert id is not None
        items = self.service.get_by_name(name)
        assert items is not None
        assert len(items) > 0
        assert items[0]['name'] == name

    def test_get_all_products(self):
        self.test_create_product()
        stores = self.service.search(tenant_id=str(self.tenant_id), store_id=str(self.store_id))
        assert len(stores) >= 1

    def test_delete_product_by_id(self):
        id = self.test_create_product()
        self.service.delete(str(id))