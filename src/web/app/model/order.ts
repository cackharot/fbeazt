import { ObjectId, Date } from "./base";
import {Restaurant} from "./restaurant";
import * as _ from "lodash";

export enum OrderStatus{
  NEW,
  CONFIRMED,
  PROGRESS,
  DELIVERED,
  CANCELLED,
  INVALID,
  UNKNOWN
}

export class Order {
  _id: ObjectId = new ObjectId();
  order_no: string;
  delivery_details: DeliveryDetails = new DeliveryDetails();
  created_at: Date;
  updated_at: Date;
  items: LineItem[] = [];
  status: OrderStatus = OrderStatus.NEW;
  delivery_charges:number = 40;

  constructor(data={}){
    Object.assign(this, data);

    this._id = ObjectId.of(this._id);
    this.items = this.items.map(x=> LineItem.of(x));
    this.delivery_details = DeliveryDetails.of(this.delivery_details);
  }

  addItem(item: LineItem){
    let cur_item = this.items.find(x=> _.isEqual(x.product_id,item.product_id));
    if(cur_item == undefined){
      item.no = this.items.length + 1;
      this.items.push(item);
    }else{
      cur_item.quantity++;
    }
  }

  getStores(){
    let stores = this.getUnique(this.items.map(x=> x.store));
    return stores;
  }

  getUnique(data:any[]){
    var unique = {};
    var distinct = [];
    data.forEach(function (x) {
      if (!unique[x._id.$oid]) {
        distinct.push(x);
        unique[x._id.$oid] = true;
      }
    });
    return distinct;
  }

  getItems(store_id=null){
    if(store_id==null){
      return this.items;
    }
    return this.items.filter(x=> _.isEqual(x.store_id,store_id));
  }

  getDeliveryCharges(){
    return this.delivery_charges;
  }

  getTotalAmount(){
    return this.getDeliveryCharges() + this.getSubTotal();
  }

  getSubTotal(){
    return this.items.reduce((n, x) => n + x.getTotalPrice(), 0);
  }

  getTotalQuantity(){
    return this.items.reduce((n, x) => n + x.quantity, 0);
  }
}

export class LineItem {
  no: number;
  product_id: ObjectId = new ObjectId();
  store_id: ObjectId = new ObjectId();
  store: Restaurant;
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
    this.store = Restaurant.of(this.store);
  }

  getTotalPrice(){
    return this.price * this.quantity;
  }

  static of(data){
    if(data == null || data.constructor.name == LineItem.name){
      return data;
    }
    return new LineItem(data);
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

  static of(data){
    if(data == null || data.constructor.name == DeliveryDetails.name){
      return data;
    }
    return new DeliveryDetails(data);
  }
}
