from datetime import datetime
import random
import unittest
from pymongo import MongoClient
from fbeazt.service.SubscriptionService import DuplicateEmailException, SubscriptionService


class test_subscription(unittest.TestCase):
    def setUp(self):
        self.dbClient = MongoClient()
        self.db = self.dbClient.test_foodbeazt_database
        self.db.subscription_collection.drop()
        self.service = SubscriptionService(self.db)

    def tearDown(self):
        pass

    def test_add_subscription(self):
        no = str(random.randint(1, 1000))
        item = {'email': 'test' + no + '@test.com', 'created_at': datetime.now(), 'ip': '10.23.35.1',
                'browser_details': 'IE10'}
        id = self.service.add(item)
        assert id is not None

    def test_duplicate_email(self):
        item = {'email': 'test@test.com', 'created_at': datetime.now(), 'ip': '10.23.35.1',
                'browser_details': 'IE10'}
        id = self.service.add(item)
        assert id is not None

        try:
            self.service.add(item)
        except DuplicateEmailException as e:
            assert True
            return
        assert False

    def test_get_all_subscriptions(self):
        self.test_add_subscription()
        items = self.service.search()
        assert len(items) > 0

    def test_get_subscription_by_email(self):
        expected = 'test@test.com'
        item = self.service.get_by_email(expected)

        if item is None:
            item = {'email': expected, 'created_at': datetime.now(), 'ip': '10.23.35.1',
                    'browser_details': 'IE10'}
            id = self.service.add(item)
            assert id is not None
            item = self.service.get_by_email(expected)

        assert item is not None and item['email'] == expected

if __name__ == '__main__':
    unittest.main()