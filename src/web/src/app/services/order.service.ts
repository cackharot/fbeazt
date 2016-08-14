import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { Headers, Http } from '@angular/http';
import { LocalStorage, SessionStorage } from "../libs/WebStorage";
import * as _ from "lodash";

import { ObjectId } from '../model/base';
import { Product } from '../model/product';
import { Order, PincodeDetail, LineItem, DeliveryDetails } from '../model/order';
import { AppConfig } from '../AppConfig';

import { OAuthService } from 'angular2-oauth2/oauth-service';

@Injectable()
export class OrderService {
  @LocalStorage() private currentOrder: Order = new Order();
  private itemAddedSource = new Subject<LineItem>();
  private deliveryUpdatedSource = new Subject<DeliveryDetails>();
  private orderConfirmedSource = new Subject<Order>();
  private orderResetedSource = new Subject<Order>();
  private orderUpdatedSource = new Subject<Order>();
  private orderUrl: string = AppConfig.ORDER_URL;

  itemAdded$ = this.itemAddedSource.asObservable();
  orderUpdated$ = this.orderUpdatedSource.asObservable();
  deliveryUpdated$ = this.deliveryUpdatedSource.asObservable();
  orderConfirmed$ = this.orderConfirmedSource.asObservable();
  orderReseted$ = this.orderResetedSource.asObservable();

  constructor(private http: Http, private authService: OAuthService) {
    this.currentOrder = Order.of(this.currentOrder);
  }

  private addLineItem(item: LineItem) {
    this.currentOrder.addItem(item);
    this.itemAddedSource.next(item);
  }

  addItem(item: Product) {
    if (!item.isAvailable()) {
      console.log("Attempt to add not available item" + item);
      return;
    }
    let lineItem = new LineItem({
      product_id: item._id,
      name: item.name,
      store_id: item.store_id,
      store: item.store,
      description: item.description,
      category: item.category,
      vegetarian: item.food_type[0] == 'veg',
      quantity: 1.0,
      price: item.sell_price
    });
    this.addLineItem(lineItem);
  }

  removeItem(item: LineItem) {
    this.currentOrder.remove(item);
    this.orderUpdatedSource.next(this.currentOrder);
  }

  updateQuantity(item: LineItem, value: number) {
    item.quantity = item.quantity + value;
    if (item.quantity <= 0) {
      this.removeItem(item);
      return;
    }
    this.orderUpdatedSource.next(this.currentOrder);
  }

  updateItemQuantity(product_id: ObjectId, value: number) {
    let item = this.currentOrder.getItemByProductId(product_id);
    this.updateQuantity(item, value);
  }

  updateDeliveryDetails(deliveryDetails: DeliveryDetails) {
    this.currentOrder.delivery_details = deliveryDetails;
    this.deliveryUpdatedSource.next(deliveryDetails);
  }

  getOrder() {
    return this.currentOrder;
  }

  confirmOrder() {
    // console.log(this.currentOrder);
    return this.http.post(`${this.orderUrl}/-1`, this.currentOrder, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let orderJson = response.json();
        // console.log(orderJson);
        let updatedOrder = Order.of(orderJson.data);

        let stores = this.currentOrder.getStores()
        updatedOrder.items.forEach(item => {
          item.store = stores.find(x => _.isEqual(x._id, item.store_id));
        });

        this.currentOrder = updatedOrder;
        this.orderConfirmedSource.next(this.currentOrder);

        return updatedOrder;
      })
      .catch(this.handleError);
  }

  resetOrder() {
    this.currentOrder = new Order();
    this.orderResetedSource.next(this.currentOrder);
  }

  cancelOrder() {
    this.resetOrder();
  }

  verifyOtp(otp: string, new_number: string) {
    let data = { 'cmd': 'VERIFY_OTP', 'otp': otp, 'order_id': this.currentOrder._id, 'number': new_number }
    return this.http.put(`${this.orderUrl}/-1`, data, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let res = response.json();
        // console.log(res);
        return res;
      })
      .catch(this.handleError);
  }

  resendOtp(new_number: string) {
    let data = { 'cmd': 'RESEND_OTP', 'order_id': this.currentOrder._id, 'number': new_number }
    return this.http.put(`${this.orderUrl}/-1`, data, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let res = response.json();
        // console.log(res);
        return res;
      })
      .catch(this.handleError);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    if (error.json === undefined) {
      return Promise.reject(error);
    }
    return Promise.reject(error.json().message);
  }

  loadOrder(orderNo: string): Promise<Order> {
    return this.http.get(`${AppConfig.TRACK_URL}/${orderNo}`, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let data = response.json();
        let order = Order.of(data);
        if (!order.order_no || order.order_no.length == 0) {
          return null;
        }
        return order;
      })
      .catch(this.handleError);
  }

  reloadOrder(): Promise<Order> {
    let no = this.getOrder().order_no;
    return this.http.get(`${AppConfig.TRACK_URL}/${no}`, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let data = response.json();
        let order = Order.of(data);
        if (!order.order_no || order.order_no.length == 0) {
          return null;
        }
        this.currentOrder = order;
        return order;
      })
      .catch(this.handleError);
  }

  fetchAvailablePincodes() {
    return this.http.get(`${AppConfig.PINCODE_URL}`, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let data = response.json();
        let items = data.map(x => PincodeDetail.of(x));
        return items;
      })
      .catch(this.handleError);
  }

  public getMyOrders(): Promise<Order[]> {
    return this.http.get(`${AppConfig.MY_ORDERS_URL}`, {
      headers: this.authHeaders()
    })
      .toPromise()
      .then(response => {
        let data = response.json();
        return data.items.map(x => Order.of(x));
      })
      .catch(this.handleError);
  }

  private authHeaders(): Headers {
    let authHeaders = new Headers();
    if (this.authService.hasValidIdToken()) {
      authHeaders.set('Authorization', 'Bearer ' + this.authService.getIdToken());
    }
    return authHeaders;
  }
}
