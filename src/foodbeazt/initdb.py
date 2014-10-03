# Set the path
import os
import sys
from bson import json_util

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
from pymongo import MongoClient
from fbeazt.service.TenantService import TenantService
from fbeazt.service.UserService import UserService


def setup():
    client = MongoClient()
    db = client.foodbeaztDb
    print("Checking admin tenant")
    tenant_service = TenantService(db)
    user_service = UserService(db)
    if not tenant_service.check_name_exists(None, "FoodBeazt"):
        print("Creating admin tenant")
        item = {"name": "FoodBeazt", "description": "super admin tenant", "website": "www.foodbeazt.in",
                "url": "www.foodbeazt.in", "type": "super_admin", "logo": "foodbeazt_logo.png",
                "contact": {"name": "admin", "email": "admin@foodbeazt.in", "phone": "+91 7373730484"},
                "address": {"address": "Puducherry", "zipcode": "605001", "country": "INDIA", "state": "Puducherry"}}
        tenant_id = tenant_service.create(item)

        user = {"name": "foodbeazt", "username": "foodbeazt@gmail.com", "email": "foodbeazt@gmail.com",
                "auth_type": "google", "tenant_id": tenant_id, "registered_ip": "10.0.0.1", "roles": ["super_admin"]}
        user_service.create(user)

    tenant = tenant_service.get_by_name("FoodBeazt")
    print(json.dumps(tenant,default=json_util.default))

    user = user_service.get_by_email("foodbeazt@gmail.com")
    print(json.dumps(user, default=json_util.default))
    pass


if __name__ == "__main__":
    print("Initializing database...")
    setup()
