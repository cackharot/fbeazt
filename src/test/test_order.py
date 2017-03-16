import os
import unittest
from random import randint

from bson import json_util
from bson.objectid import ObjectId
from foodbeazt import fapp
from foodbeazt import initdb as fdb
from foodbeazt.service.ProductService import ProductService
from foodbeazt.service.StoreService import StoreService


class CreateOrderTestCase(unittest.TestCase):
    """
    Testing order api
    """
    def setUp(self):
        fapp.app.config['TESTING'] = True
        fapp.app.config['MONGO_AUTO_START_REQUEST'] = False
        self.dbname = 'testFoodbeaztDb'
        fapp.app.config['MONGO_DBNAME'] = self.dbname
        self.app = fapp.app.test_client()
        with fapp.app.app_context():
            fdb.drop_db(dbname=self.dbname)
            fdb.setup(dbname=self.dbname, sample_data=True, debug=False)
            self.price_table_item, self.no_discount_item, self.discount_item = fdb.setup_test_product(
                dbname=self.dbname)

    def tearDown(self):
        with fapp.app.app_context():
            fapp.mongo.cx.drop_database(self.dbname)
            fapp.mongo.cx.close()

    def test_get_invalid_order(self):
        """Test invalid order fetch"""
        result = self.app.get('/api/order/' + str(ObjectId()))
        self.assertEqual(result.status_code, 404)

    def test_get_order(self):
        """Test valid order fetch"""
        order_id = self.test_create_order()
        result = self.app.get('/api/order/' + str(order_id))
        self.assertEqual(result.status_code, 200)
        order = json_util.loads(result.data.decode('utf-8'))
        self.assertEqual(order.get('status'), 'PENDING')
        self.assertEqual(order.get('payment_type'), 'cod')
        self.assertEqual(order.get('total'), 90.0 + 333.0 + (100.0-(100.0*3.3/100.0)) + 40.0)

    def test_create_order(self):
        """Test create order"""
        hdrs = {'Content-Type': 'application/json'}
        request_data = json_util.dumps(self._get_order_data())
        result = self.app.post(
            '/api/order/-1', data=request_data, headers=hdrs)
        if result.status_code != 200:
            print(result.data)
        self.assertEqual(result.status_code, 200)
        res = json_util.loads(result.data.decode('utf-8'))
        self.assertEqual(res.get('status'), 'success')
        order = res.get('data')
        self.assertEqual(order.get('delivery_charges'), 40)
        self.assertEqual(order.get('total'), 90.0 + 333.0 + (100.0-(100.0*3.3/100.0)) + 40.0)
        self.assertEqual(order.get('payment_status'), 'success')
        self.assertEqual(order.get('status'), 'PENDING')
        self.assertEqual(len(order.get('store_delivery_status')), 1)
        for s, v in order.get('store_delivery_status').items():
            self.assertEqual(v.get('status'), 'PENDING')
            self.assertIsNotNone(v.get('sid'))
            self.assertIsNotNone(v.get('notified_at'))
        return order.get('_id')

    def _get_order_data(self):
        item1 = {
            'name': 'test item 1',
            'quantity': 1.0,
            'product_id': self.price_table_item,
            'price_detail': {'no': 1}
        }
        item2 = {
            'name': 'test item 2',
            'quantity': 1.0,
            'product_id': self.no_discount_item,
        }
        item3 = {
            'name': 'test item 3',
            'quantity': 1.0,
            'product_id': self.discount_item,
        }
        data = {
            'items': [item1, item2, item3],
            'delivery_details': {
                'name': 'some hungry fellow',
                'email': 'cackharot@gmail.com',
                'phone': str(randint(9000000000, 9999999999)),
                'pincode': '605001',
                'address': 'some dude address'
            },
            'payment_type': 'cod'
        }
        return data

if __name__ == '__main__':
    unittest.main()
