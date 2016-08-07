import { ObjectId, Date } from "./base";
import { Restaurant } from "./restaurant";
import * as _ from "lodash";

export class OrderStatus {
  static NEW = "NEW";
  static CONFIRMED = "CONFIRMED";
  static PREPARING = "PREPARING";
  static PROGRESS = "PROGRESS";
  static DELIVERED = "DELIVERED";
  static CANCELLED = "CANCELLED";
  static INVALID = "INVALID";
}

export class Order {
  static MIN_DELIVERY_CHARGES = 40;
  static PER_STORE_CHARGES = 25;
  _id: ObjectId = new ObjectId();
  order_no: string;
  otp_status: string = '';
  delivery_details: DeliveryDetails = new DeliveryDetails();
  created_at: Date;
  updated_at: Date;
  delivered_at: Date;
  items: LineItem[] = [];
  status: string = OrderStatus.NEW;
  delivery_charges: number;
  total: number;

  static of(data) {
    if (data && data.constructor.name !== Order.name) {
      return new Order(data);
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
    this.items = this.items.map(x => LineItem.of(x));
    this.delivery_details = DeliveryDetails.of(this.delivery_details);
    this.created_at = Date.of(this.created_at);
    this.updated_at = Date.of(this.updated_at);
    this.delivered_at = Date.of(this.delivered_at);
  }

  addItem(item: LineItem) {
    let cur_item = this.items.find(x => _.isEqual(x.product_id, item.product_id));
    if (cur_item === undefined) {
      item.no = this.items.length + 1;
      this.items.push(item);
    } else {
      cur_item.quantity++;
    }
  }

  remove(item: LineItem) {
    let idx = this.items.findIndex(x => x === item);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    } else {
      console.log("Invalid item given to remove!");
    }
  }

  getStores() {
    let stores = this.getUnique(this.items.map(x => x.store));
    return stores;
  }

  private getUnique(data: any[]) {
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

  isValid() {
    let hasClosedItems = this.items.filter(x => x.store.isClosed()).length > 0;
    return this.getSubTotal() > 0 && !hasClosedItems;
  }

  getItems(store_id = null) {
    if (store_id === null) {
      return this.items;
    }
    return this.items.filter(x => _.isEqual(x.store_id, store_id));
  }

  getItemQuantity(product_id: ObjectId) {
    let item = this.getItemByProductId(product_id);
    if (item !== null) {
      return item.quantity;
    }
    return -1;
  }

  getItemByProductId(product_id: ObjectId) {
    let item = this.items.filter(x => _.isEqual(x.product_id, product_id));
    return item.length == 1 ? item[0] : null;
  }

  getDeliveryCharges() {
    let storeCount = this.getStores().length;
    let minCharge = this.getMinDeliveryCharges();
    if (storeCount <= 1) {
      this.delivery_charges = minCharge;
    } else {
      this.delivery_charges = minCharge + ((storeCount - 1) * this.getPerStoreDeliveryCharges());
    }
    return this.delivery_charges;
  }

  getMinDeliveryCharges() {
    return Order.MIN_DELIVERY_CHARGES;
  }

  getPerStoreDeliveryCharges() {
    return Order.PER_STORE_CHARGES;
  }

  getTotalAmount() {
    return this.getDeliveryCharges() + this.getSubTotal();
  }

  getSubTotal() {
    return this.items.reduce((n, x) => n + x.getTotalPrice(), 0);
  }

  getTotalQuantity() {
    return this.items.reduce((n, x) => n + x.quantity, 0);
  }

  isConfirmed() {
    return this.order_no && this.order_no.length > 0 && this.otp_status === 'VERIFIED';
  }

  isOtpSent() {
    return this.otp_status === 'SENT';
  }

  isDelivered() {
    return this.status === OrderStatus.DELIVERED;
  }

  isCancelled() {
    return this.status === OrderStatus.CANCELLED;
  }

  inProgress() {
    return this.status === OrderStatus.PROGRESS;
  }

  inPrepration() {
    return this.status === OrderStatus.PREPARING;
  }

  isInValid() {
    return this.status === OrderStatus.INVALID;
  }

  getHash() {
    let i = (this.items.length * 32 + this.getTotalAmount() * 32) << 2;
    return i.toString();
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

  static of(data) {
    if (data && data.constructor.name !== LineItem.name) {
      return new LineItem(data);
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
    this.product_id = ObjectId.of(this.product_id);
    this.store_id = ObjectId.of(this.store_id);
    this.store = Restaurant.of(this.store);
  }

  getTotalPrice() {
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

  static of(data) {
    if (data && data.constructor.name !== DeliveryDetails.name) {
      return new DeliveryDetails(data);
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
    this.customer_id = ObjectId.of(this.customer_id);
  }
}

export class PincodeDetail {
  _id: ObjectId = new ObjectId();
  pincode: string;
  area: string;
  rate: number;
  status: boolean;

  static of(data) {
    if (data && data.constructor.name !== PincodeDetail.name) {
      return new PincodeDetail(data);
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
  }
}
