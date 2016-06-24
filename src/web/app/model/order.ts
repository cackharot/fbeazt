import { ObjectId, Date } from "./base";

export class Order {
  _id: ObjectId = new ObjectId();
  order_no: string;
  delivery_details: DeliveryDetails = new DeliveryDetails();
  created_at: Date;
  updated_at: Date;
  items: LineItem[];
  status: string;

  constructor(data={}){
    Object.assign(this, data);

    this._id = ObjectId.of(this._id);

    if(this.items == undefined){
      this.items = [];
      this.status = 'NEW';
    }
    if(this.items.length > 0 && this.items[0].constructor.name != 'LineItem'){
      this.items = this.items.map(x=>new LineItem(x));
    }
    if(this.delivery_details.constructor.name != 'DeliveryDetails'){
      this.delivery_details = new DeliveryDetails(this.delivery_details);
    }
  }

  confirm(){
    this.status = 'CONFIRMED';
  }

  addItem(item: LineItem){
    let cur_item = this.items.find(x=>x.product_id == item.product_id);
    if(cur_item == undefined){
      item.no = this.items.length + 1;
      this.items.push(item);
    }else{
      cur_item.quantity++;
    }
  }

  getStores(){
    let stores = this.items.map(x=> ({store_name: x.store_name,store_id: x.store_id}));
    return stores;
  }

  getItems(store_id){
    return this.items.filter(x=>x.store_id == store_id);
  }

  getTotalAmount(){
    let price = 0;
    this.items.forEach(x=> price = price + x.getTotalPrice());
    return price;
  }

  getTotalQuantity(){
    let quantity = 0;
    this.items.forEach(x=> quantity = quantity + x.quantity);
    return quantity;
  }
}

export class LineItem {
  no: number;
  product_id: ObjectId = new ObjectId();
  store_id: ObjectId = new ObjectId();
  store_name: string;
  name: string;
  description: string;
  category: string;
  vegetarian: boolean;
  quantity: number;
  price: number;

  constructor(data={}){
    Object.assign(this, data);
    this.product_id = ObjectId.of(this.product_id);
    this.store_id = ObjectId.of(this.store_id);
  }

  getTotalPrice(){
    return this.price * this.quantity;
  }
}

export class DeliveryDetails {
  customer_id: ObjectId = new ObjectId();
  name: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
  landmark: string;
  state: string;
  city: string;
  country: string;
  notes: string;

  constructor(data={}){
    Object.assign(this, data);
    this.customer_id = ObjectId.of(this.customer_id);
  }
}
