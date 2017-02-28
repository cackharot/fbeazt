import { ObjectId, Date } from './base';
import * as moment from 'moment';

import {Restaurant} from './restaurant';
import {AppConfig} from '../AppConfig';

export class PriceDetail {
  no: number;
  description: string;
  price: number;
  discount: number;

  static of(data) {
    if (!data || data.constructor.name === PriceDetail.name) {
      return data;
    }
    return new PriceDetail(data);
  }

  constructor(data = {}) {
    Object.assign(this, data);
    if(!this.discount || this.discount == NaN){
      this.discount = 0;
    }
  }

  getDiscountedPrice() {
    if(this.discount <= 0.0){
      return this.price;
    }
    return this.price - (this.price * (this.discount/100));
  }

  getFormattedPrice() {
    if(this.discount <= 0.0){
      return ''+this.price;
    }
    return '<em class="strike">'+this.price+'</em> ' + this.getDiscountedPrice();
  }
}

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
  no: number = 0;
  image_url: string = null;
  price_table: PriceDetail[] = [];
  selectedPriceDetail: PriceDetail;

  static of(data) {
    if (data === null || data.constructor.name === Product.name) {
      return data;
    }
    return new Product(data);
  }

  constructor(data: any = {}) {
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
    this.store_id = ObjectId.of(this.store_id);
    this.store = Restaurant.of(this.store);
    if (data.price_table && data.price_table.length > 0) {
      this.price_table = data.price_table.map(x => PriceDetail.of(x));
      this.selectedPriceDetail = this.price_table[0];
    }
  }

  isVeg() {
    return this.food_type.filter(x => x === 'veg').length === 1;
  }

  isNonVeg() {
    return !this.isVeg();
  }

  isAvailable() {
    if (this.status === false) {
      return false;
    }
    if (this.store.isHoliday() || this.store.isClosed()) {
      return false;
    }
    return this.isOpen();
  }

  isOpen() {
    let hr = moment().hour() + (moment().minute() / 60);
    return (hr >= this.open_time && hr <= this.close_time);
  }

  hasPriceTable() {
    return this.price_table && this.price_table.length > 0;
  }

  getImage() {
    if (!this.image_url) {
      return null;
    }
    return AppConfig.getProductImage(this.image_url);
  }

  getFormattedTime(time_val: number) {
    if (time_val < 12) {
      return time_val.toFixed(0) + ' AM';
    } else if (time_val === 12) {
      return time_val.toFixed(0) + ' NOON';
    } else if (time_val === 24) {
      return '00 AM';
    } else {
      return (time_val - 12).toFixed(0) + ' PM';
    }
  }

  getFormattedAvailableTimings() {
    return this.getFormattedTime(this.open_time) + ' to ' + this.getFormattedTime(this.close_time);
  }

  getFormattedPrice() {
    if(this.discount <= 0.0){
      return ''+this.sell_price;
    }
    return '<em class="strike">'+this.sell_price+'</em> ' + this.getDiscountedPrice();
  }

  getDiscountedPrice() {
    if(this.discount <= 0.0){
      return this.sell_price;
    }
    return this.sell_price - (this.sell_price * (this.discount/100));
  }
}

export class Category {
  name: string;
  products: Product[] = [];

  constructor(data = {}) {
    Object.assign(this, data);
    if (this.products.length > 0) {
      this.products = this.products.map(x => new Product(x));
    }
  }

  addProduct(item: Product) {
    this.products.push(item);
  }
}
