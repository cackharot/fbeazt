# Set the path
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
import random
from bson import json_util
from pymongo import MongoClient
from service.TenantService import TenantService
from service.UserService import UserService
from service.ProductService import ProductService
from service.StoreService import StoreService
from service.PincodeService import PincodeService
import logging

logger = logging.getLogger(__name__)

cuisines = ['north indian', 'south indian',
            'chineese', 'italian', 'english', 'american']
category = ['starter', 'maincourse', 'deserts', 'specials']
food_types = ['veg', 'non-veg']
weekdays = ['Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday', 'Sunday']
log_enabled = True


def log(msg):
    global log_enabled
    if not log_enabled:
        return
    logger.info(msg)


def create_sample_data(db, tenant_id):
    store_service = StoreService(db)
    store = store_service.get_by_name('Test Store')

    if store is not None:
        log("Sample seed data already created!!")
        return

    for i in range(1, 50):
        store_name = "My Store %d" % (i)
        store = {'tenant_id': tenant_id,
                 'name': store_name,
                 'contact_name': 'test contact',
                 'contact_email': 'test@test.com',
                 'address': 'sample address',
                 'phone': random.randint(600000, 6999999),
                 'food_type': food_types,
                 'holidays': [weekdays[i % len(weekdays)]],
                 'is_closed': False,
                 'rating': 0,
                 'cuisines': [cuisines[i % len(cuisines)], cuisines[i % (len(cuisines) - 1)]],
                 'open_time': random.randint(7, 11),
                 'close_time': random.randint(8, 12),
                 'deliver_time': random.randint(20, 60)}
        store_service.save(store)
        item_count = create_items(db, tenant_id, store['_id'])
        log("Created %s with %d items" % (store_name, item_count))


def create_items(db, tenant_id, store_id):
    product_service = ProductService(db)
    items = product_service.search(tenant_id, store_id)
    if len(items) > 20:
        log('Products already added!')
        return

    item_count = random.randint(20, 50)
    for i in range(0, item_count):
        no = str(random.randint(100, 12563))
        price = random.randint(10, 500)
        item = {'tenant_id': tenant_id,
                'store_id': store_id,
                'name': 'Item ' + no,
                'barcode': '1256' + no,
                'food_type': [food_types[i % len(food_types)]],
                'cuisines': [cuisines[i % len(cuisines)]],
                'category': category[i % len(category)],
                'open_time': 8,
                'close_time': 11,
                'status': False,
                'deliver_time': 45,
                'buy_price': price - 10.0,
                'sell_price': price,
                'discount': 0.0}
        product_service.create(item)
    # log("Created %d products" % (item_count))
    return item_count


def setup_test_product(host='localhost', port=27017, dbname='foodbeaztDb'):
    client = MongoClient(host=host, port=port)
    db = client[dbname]
    store_service = StoreService(db)
    product_service = ProductService(db)
    tenant_service = TenantService(db)
    tenant = tenant_service.get_by_name("FoodBeazt")
    tenant_id = tenant['_id']
    store = store_service.get_by_name('My Store 1')
    store_id = store['_id']
    pd = [{'no': 1, 'name': 'low', 'description': 'some desc',
           'price': 100.0, 'discount': 10.0}]
    p1 = product_service.create(
        test_item(tenant_id, store_id, 'test product1', 100.0, 10.0, pd))
    p2 = product_service.create(
        test_item(tenant_id, store_id, 'test product2', 333.0, 0.0))
    p3 = product_service.create(
        test_item(tenant_id, store_id, 'test product3', 100.0, 3.3))
    return p1, p2, p3


def test_item(tenant_id, store_id, name, price, discount, pd=None):
    return {
        'tenant_id': tenant_id,
        'store_id': store_id,
        'name': name,
        'barcode': '1256',
        'food_type': ['veg'],
        'cuisines': ['testcusine'],
        'category': 'starter',
        'open_time': 8,
        'close_time': 11,
        'status': True,
        'deliver_time': 45,
        'buy_price': price-10,
        'sell_price': price,
        'discount': discount,
        'price_table': pd
    }


def setup(host='localhost', port=27017, dbname='foodbeaztDb', sample_data=False, debug=True):
    global log_enabled
    log_enabled = debug
    client = MongoClient(host=host, port=port)
    db = client[dbname]
    log("Checking admin tenant")
    tenant_service = TenantService(db)
    user_service = UserService(db)
    pincode_service = PincodeService(db)

    if not tenant_service.check_name_exists(None, "FoodBeazt"):
        log("Creating admin tenant")
        item = {"name": "FoodBeazt", "description": "super admin tenant", "website": "http://www.foodbeazt.in",
                "url": "http://www.foodbeazt.in", "type": "super_admin", "logo": "foodbeazt_logo.png",
                "contact": {"name": "admin", "email": "foodbeazt@gmail.com", "phone": "+91 7373730484"},
                "registered_ip": "10.0.0.1",
                "address": {"address": "Puducherry", "zipcode": "605001", "country": "INDIA", "state": "Puducherry"}}
        tenant_id = tenant_service.create(item)

        item['tenant_id'] = tenant_id
        tenant_service.update(item)

    log('\nTenant:')
    tenant = tenant_service.get_by_name("FoodBeazt")
    log(json.dumps(tenant, default=json_util.default))
    tenant_id = tenant['_id']

    log('\nUser:')
    user = user_service.get_by_email("foodbeazt@gmail.com")
    log(json.dumps(user, default=json_util.default))

    log("Setup pincode")
    pincode = {'pincode': '605001'}
    pincode_service.save(pincode)

    if sample_data:
        log('\nCreating sample product data:')
        create_sample_data(db, tenant_id)


def drop_db(host='localhost', port=27017, dbname='test'):
    log("Connecting to '%s':%d" % (host, port))
    c = MongoClient(host=host, port=port)
    log('Dropping database...')
    c.drop_database(dbname)
    log('Drop successfull')

if __name__ == "__main__":
    sample_data = False
    host = os.environ.get('MONGO_HOST', 'localhost')
    port = int(os.environ.get('MONGO_PORT', 27017))
    dbname = os.environ.get('MONGO_DBNAME', 'foodbeaztDb')
    if len(sys.argv) > 1:
        if sys.argv[1] == "drop":
            drop_db(host, port, dbname)
        if len(sys.argv) > 2 and sys.argv[2] == "test-data":
            sample_data = True

    log("Initializing database...")
    setup(host, port, dbname, sample_data)
