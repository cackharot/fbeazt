import { ObjectId, Date } from './base';
import * as moment from 'moment';

import {Restaurant} from './restaurant';

export class Product {
  _id: ObjectId = new ObjectId();
  deliver_time: number;
  cuisines: string[];
  buy_price: number;
  open_time: number;
  store_id: ObjectId = new ObjectId();
  store: Restaurant = new Restaurant();
  discount: number;
  close_time: number;
  category: string;
  created_at: Date;
  sell_price: number;
  tenant_id: ObjectId = new ObjectId();
  barcode: string;
  food_type: string[];
  updated_at: Date;
  name: string;
  description: string = ' ';
  status: boolean;
  is_popular: boolean = false;
  no: number=0;
  image_url: string = null;

  static of(data) {
    if(data === null || data.constructor.name === Product.name) {
      return data;
    }
    return new Product(data);
  }

  constructor(data = {}) {
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
    this.store_id = ObjectId.of(this.store_id);
    this.store = Restaurant.of(this.store);
  }

  isVeg() {
    return this.food_type.filter(x => x === 'veg').length === 1;
  }

  isNonVeg() {
    return !this.isVeg();
  }

  isAvailable() {
    if(this.status === false) return false;
    if(this.store.isHoliday() || this.store.isClosed()) {
      return false;
    }
    // return this.isOpen();
    return true;
  }

  isOpen() {
    let hr = moment().hour() + (moment().minute() / 60);
    return (hr >= this.open_time && hr <= (this.close_time + 12));
  }
}

export class Category {
  name: string;
  products: Product[] = [];

  constructor(data = {}) {
    Object.assign(this, data);
    if(this.products.length > 0) {
      this.products = this.products.map(x => new Product(x));
    }
  }

  addProduct(item: Product) {
    this.products.push(item);
  }
}
