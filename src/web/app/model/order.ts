import { ObjectId, Date } from "./base";

export class Order {
  _id: ObjectId;
  delivery_details: DeliveryDetails;
  delivery_date: Date;
  created_date: Date;
  state: string;
  items: LineItem[];
  status: boolean;

  constructor(){
    this.items = [];
    this.status = false;
    this.state = 'NEW';
  }

  confirm(){
    this.status=true;
    this.state = 'CONFIRMED';
  }

  addItem(item: LineItem){
    let cur_item = this.items.find(x=>x.product_id == item.product_id);
    if(cur_item == undefined){
      this.items.push(item);
    }else{
      cur_item.quantity++;
    }
  }

  getTotalAmount(){
    let price = 0;
    this.items.forEach(x=> price = price + x.price);
    return price;
  }

  getTotalQuantity(){
    let quantity = 0;
    this.items.forEach(x=> quantity = quantity + x.quantity);
    return quantity;
  }
}

export class LineItem {
  _id: ObjectId;
  product_id: ObjectId;
  name: string;
  description: string;
  category: string;
  vegetarian: boolean;
  quantity: number;
  price: number;

  constructor(product_id: ObjectId, name: string,
    desc: string, category: string, food_type: string,
    quantity: number, price: number){
      this.product_id = product_id;
      this.name = name;
      this.description = desc;
      this.category = category;
      this.vegetarian = food_type === 'veg';
      this.quantity = quantity;
      this.price = price;
    }
}

export class DeliveryDetails {
  customer_id: ObjectId;
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
}
