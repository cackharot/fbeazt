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


def create_sample_data(db, tenant_id):
    store_service = StoreService(db)
    product_service = ProductService(db)

    store = store_service.get_by_name('Test Store')

    if store is None:
        store = {'tenant_id': tenant_id, 'name': 'Test Store', 'address': 'sample address', 'phone': '1234569870',
                 'food_type': ['veg'], 'cuisine': 'indian', 'open_time': 8, 'close_time': 11, 'deliver_time': 45}
        store_service.save(store)

    store_id = store['_id']
    print('\nStore:')
    print(json.dumps(store, default=json_util.default))

    items = product_service.search(tenant_id, store_id)

    if len(items) > 100:
        print('100 products already added!')
        return

    category = ['starter', 'maincourse', 'deserts', 'specials']
    food_types = ['veg', 'non-veg']

    print('\nProducts:')
    for i in range(0, 100):
        no = str(random.randint(100, 12563))
        price = random.randint(10, 500)
        item = {'tenant_id': tenant_id, 'name': 'Item ' + no, 'barcode': '1256' + no,
                'food_type': [food_types[i % len(food_types)]],
                'cuisine': 'indian', 'store_id': store_id, 'category': category[i % len(category)],
                'open_time': 8, 'close_time': 11, 'deliver_time': 45, 'buy_price': price - 10.0,
                'sell_price': price,
                'discount': 0.0}
        product_service.create(item)

    print('\nCreated 100 products!')

    pass


def setup():
    client = MongoClient()
    db = client.foodbeaztDb
    print("Checking admin tenant")
    tenant_service = TenantService(db)
    user_service = UserService(db)

    if not tenant_service.check_name_exists(None, "FoodBeazt"):
        print("Creating admin tenant")
        item = {"name": "FoodBeazt", "description": "super admin tenant", "website": "http://www.foodbeazt.in",
                "url": "http://www.foodbeazt.in", "type": "super_admin", "logo": "foodbeazt_logo.png",
                "contact": {"name": "admin", "email": "admin@foodbeazt.in", "phone": "+91 7373730484"},
                "registered_ip": "10.0.0.1",
                "address": {"address": "Puducherry", "zipcode": "605001", "country": "INDIA", "state": "Puducherry"}}
        tenant_id = tenant_service.create(item)

        item['tenant_id'] = tenant_id
        tenant_service.update(item)

    print('\nTenant:')
    tenant = tenant_service.get_by_name("FoodBeazt")
    print(json.dumps(tenant, default=json_util.default))
    tenant_id = tenant['_id']

    print('\nUser:')
    user = user_service.get_by_email("foodbeazt@gmail.com")
    print(json.dumps(user, default=json_util.default))

    print('\nSample data:')
    create_sample_data(db, tenant_id)

    pass


if __name__ == "__main__":
    print("Initializing database...")
    setup()
