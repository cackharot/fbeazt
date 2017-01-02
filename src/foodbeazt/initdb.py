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

cuisines = ['north indian','south indian','chineese','italian','english','american']
category = ['starter', 'maincourse', 'deserts', 'specials']
food_types = ['veg', 'non-veg']
weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

def create_sample_data(db, tenant_id):
  store_service = StoreService(db)
  store = store_service.get_by_name('Test Store')

  if store is not None:
    print("Sample seed data already created!!")
    return

  for i in range(1,50):
    store_name = "My Store %d" % (i)
    store = {'tenant_id': tenant_id,
            'name': store_name,
            'address': 'sample address',
            'phone': random.randint(600000,6999999),
            'food_type': food_types,
            'holidays': [weekdays[i%len(weekdays)]],
            'is_closed': False,
            'rating': 0,
            'cuisines': [cuisines[i % len(cuisines)], cuisines[i % (len(cuisines)-1)]],
            'open_time': random.randint(7,11),
            'close_time': random.randint(8,12),
            'deliver_time': random.randint(20,60)}
    store_service.save(store)
    item_count = create_items(db, tenant_id, store['_id'])
    print("Created %s with %d items" %(store_name, item_count))

def create_items(db, tenant_id, store_id):
  product_service = ProductService(db)
  items = product_service.search(tenant_id, store_id)
  if len(items) > 20:
    print('Products already added!')
    return

  item_count = random.randint(20,50)
  for i in range(0, item_count):
    no = str(random.randint(100, 12563))
    price = random.randint(10, 500)
    item = {'tenant_id': tenant_id,
            'store_id': store_id,
            'name': 'Item ' + no,
            'barcode': '1256' + no,
            'food_type': [food_types[i % len(food_types)]],
            'cuisines': [cuisines[i %len(cuisines)]],
            'category': category[i % len(category)],
            'open_time': 8,
            'close_time': 11,
            'status': False,
            'deliver_time': 45,
            'buy_price': price - 10.0,
            'sell_price': price,
            'discount': 0.0}
    product_service.create(item)
  # print("Created %d products" % (item_count))
  return item_count

def setup(sample_data=False):
    host = os.environ.get('MONGO_HOST', 'localhost')
    port = int(os.environ.get('MONGO_PORT', 27017))
    client = MongoClient(host=host,port=port)
    db = client.foodbeaztDb
    print("Checking admin tenant")
    tenant_service = TenantService(db)
    user_service = UserService(db)

    if not tenant_service.check_name_exists(None, "FoodBeazt"):
        print("Creating admin tenant")
        item = {"name": "FoodBeazt", "description": "super admin tenant", "website": "http://www.foodbeazt.in",
                "url": "http://www.foodbeazt.in", "type": "super_admin", "logo": "foodbeazt_logo.png",
                "contact": {"name": "admin", "email": "foodbeazt@gmail.com", "phone": "+91 7373730484"},
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

    if sample_data:
      print('\nCreating sample product data:')
      create_sample_data(db, tenant_id)

if __name__ == "__main__":
  sample_data = False
  if len(sys.argv) > 1:
    if sys.argv[1] == "drop":
      print('Dropping database...')
      host = os.environ.get('MONGO_HOST', 'localhost')
      port = int(os.environ.get('MONGO_PORT', 27017))
      print("Connecting to '%s':%d" % (host,port))
      c = MongoClient(host=host,port=port)
      c.drop_database('foodbeaztDb')
      print('Drop successfull')
    if len(sys.argv) > 2 and sys.argv[2] == "test-data":
      sample_data = True

  print("Initializing database...")
  setup(sample_data)
