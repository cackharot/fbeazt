import { ObjectId, Date } from "./base";

export class Order {
  _id: ObjectId;
  delivery_details: DeliveryDetails = new DeliveryDetails();
  delivery_date: Date;
  created_date: Date;
  state: string;
  items: LineItem[];
  status: boolean;

  constructor(data={}){
    Object.assign(this, data);
    if(this.items == undefined){
      this.items = [];
      this.status = false;
      this.state = 'NEW';
    }
    if(this.items.length > 0 && this.items[0].constructor.name != 'LineItem'){
      this.items = this.items.map(x=>new LineItem(x));
    }
    if(this.delivery_details.constructor.name != 'DeliveryDetails'){
      this.delivery_details = new DeliveryDetails(this.delivery_details);
    }
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

  constructor(data={}){
    Object.assign(this, data);
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

  constructor(data={}){
    Object.assign(this, data);
  }
}
