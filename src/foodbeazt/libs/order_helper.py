

class OrderHelper(object):

    def __init__(self, productService):
        self.productService = productService

    def validate_line_items(self, order):
        if len(order.get('items', [])) == 0:
            return "Atleast one item is required to process the order", []
        else:
            count = 1
            validation_error = None
            sanitized_items = []
            for item in order['items']:
                if item.get('product_id') is None:
                    validation_error = "Invalid product id"
                    break
                else:
                    if float(item.get('quantity', 0)) <= 0.0:
                        validation_error = "%(name)'s quantity should be atleast 1.0" % (item['name'])
                        break
                    else:
                        product = self.productService.get_by_id(item['product_id'])
                        if product is None:
                            validation_error = "Product not found with id %s" % (item['product_id'])
                            break
                        elif product.get('status', True) is False:
                            validation_error = "%s is currently unavailable" % (product['name'])
                            break
                        else:
                            qty = float(item['quantity'])
                            price = float(product['sell_price'])
                            discount = float(product.get('discount', 0.0))
                            vi = {
                                'no': count,
                                'product_id': product['_id'],
                                'name': product['name'],
                                'description': product.get('description', None),
                                'price': price,
                                'discount': discount,
                                'quantity': qty,
                                'total': (qty * (price - price*discount/100.0)),
                                'category': product.get('category', None),
                                'store_id': product['store_id']
                            }
                            if 'price_detail' in item and item['price_detail'] is not None and 'no' in item['price_detail']:
                                pd_no = int(item['price_detail']['no'])
                                pds = [x for x in product['price_table'] if x['no'] == pd_no]
                                if len(pds) != 1:
                                    validation_error = "Invalid price detail for the product '%s'" % (product['name'])
                                    break
                                pd = pds[0]
                                price = float(pd['price'])
                                discount = float(pd.get('discount', 0.0))
                                vi['price_detail'] = {'no': pd['no'], 'price': price, 'description': pd['description'], 'discount': discount}
                                vi['price'] = price
                                vi['discount'] = discount
                                vi['total'] = (qty * (price - price*discount/100.0))
                            sanitized_items.append(vi)
                            count = count + 1
            return validation_error, sanitized_items

    def validate_delivery_details(self, order):
        delivery_details = order.get('delivery_details', None)
        if delivery_details is None:
            return "Invalid delivery details", None
        if delivery_details.get('name', None) is None or len(delivery_details['name']) < 3 or len(delivery_details['name']) > 50:
            return "Invalid name", None
        if delivery_details.get('email', None) is None or len(delivery_details['email']) < 3or len(delivery_details['email']) > 200:
            return "Invalid email address", None
        if delivery_details.get('phone', None) is None or len(delivery_details['phone']) != 10:
            return "Invalid phone number", None
        elif delivery_details['phone'].startswith('0'):
            return "Phone number should not start with '0'", None
        if delivery_details.get('pincode', None) is None or len(delivery_details['pincode']) != 6:
            return "Invalid pincode", None
        if delivery_details.get('address', None) is None or len(delivery_details['address']) < 6 or len(delivery_details['address']) > 500:
            return "Invalid address", None
        return None, {
            'name': delivery_details['name'],
            'email': delivery_details['email'],
            'phone': delivery_details['phone'],
            'pincode': delivery_details['pincode'],
            'address': delivery_details['address'],
            'landmark': delivery_details.get('landmark', None),
            'city': 'Puducherry',
            'state': 'Puducherry',
            'country': 'India',
            'notes': delivery_details.get('notes', None)
        }
