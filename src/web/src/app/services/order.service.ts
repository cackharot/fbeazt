import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { Headers, URLSearchParams, Http } from '@angular/http';
import { LocalStorage } from '../libs/WebStorage';
import * as _ from 'lodash';

import { ObjectId } from '../model/base';
import { Product, PriceDetail } from '../model/product';
import { Order, PincodeDetail, LineItem, DeliveryDetails } from '../model/order';
import { AppConfig } from '../AppConfig';

import { OAuthService } from 'angular2-oauth2/oauth-service';

export class MyOrderSearchModel {
  page_no: number = 1;
  page_size: number = 10;

  toUrlSearchParams(): URLSearchParams {
    let params: URLSearchParams = new URLSearchParams();
    params.set('page_no', this.page_no.toString());
    params.set('page_size', this.page_size.toString());
    return params;
  }
}

export class MyOrderSearchResult extends MyOrderSearchModel {
  items: Order[];
  total: number;
  next: string;
  previous: string;

  static of(data) {
    if (data === null || data.constructor.name === MyOrderSearchResult.name) {
      return data;
    }
    return new MyOrderSearchResult(data);
  }

  constructor(data = {}) {
    super();
    Object.assign(this, data);
    this.items = this.items.map(x => Order.of(x));
  }
}

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
      console.log('Attempt to add not available item' + item);
      return;
    }
    let lineItem = new LineItem({
      product_id: item._id,
      name: item.name,
      store_id: item.store_id,
      store: item.store,
      description: item.description,
      category: item.category,
      vegetarian: item.food_type[0] === 'veg',
      quantity: 1.0,
      price: item.sell_price,
      discount: item.discount,
      price_detail: item.selectedPriceDetail
    });
    this.addLineItem(lineItem);
  }

  removeItem(item: LineItem) {
    this.currentOrder.remove(item);
    this.orderUpdatedSource.next(this.currentOrder);
  }

  updateQuantity(item: LineItem, value: number) {
    if (!item) {
      console.error('requested item to update quantity not found');
      return;
    }
    item.quantity = item.quantity + value;
    if (item.quantity <= 0) {
      this.removeItem(item);
      return;
    }
    this.orderUpdatedSource.next(this.currentOrder);
  }

  updateItemQuantity(product_id: ObjectId, value: number, price_detail: PriceDetail) {
    let item = this.currentOrder.getItemsByProductId(product_id, price_detail);
    this.updateQuantity(item, value);
  }

  updateItemPriceDetail(product_id: ObjectId, value: PriceDetail) {
    let item = this.currentOrder.getItemsByProductId(product_id);
    if (item) {
      item.price_detail = value;
      this.orderUpdatedSource.next(this.currentOrder);
    }
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
    return this.http.post(
      `${this.orderUrl}/-1`,
      this.currentOrder,
      {
        headers: this.authHeaders()
      })
      .toPromise()
      .then(response => {
        let orderJson = response.json();
        // console.log(orderJson);
        let updatedOrder = Order.of(orderJson.data);

        let stores = this.currentOrder.getStores();
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
    let data = { 'cmd': 'VERIFY_OTP', 'otp': otp, 'order_id': this.currentOrder._id, 'number': new_number };
    return this.http.put(
      `${this.orderUrl}/-1`,
      data,
      {
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
    let data = { 'cmd': 'RESEND_OTP', 'order_id': this.currentOrder._id, 'number': new_number };
    return this.http.put(
      `${this.orderUrl}/-1`, data,
      {
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
    return this.http.get(
      `${AppConfig.TRACK_URL}/${orderNo}`,
      {
        headers: this.authHeaders()
      })
      .toPromise()
      .then(response => {
        let data = response.json();
        let order = Order.of(data);
        if (!order.order_no || order.order_no.length === 0) {
          return null;
        }
        return order;
      })
      .catch(this.handleError);
  }

  reloadOrder(): Promise<Order> {
    let no = this.getOrder().order_no;
    if (no === undefined || no.length === 0) {
      return Promise.reject<Order>('Invalid order');
    }
    return this.http.get(
      `${AppConfig.TRACK_URL}/${no}`,
      {
        headers: this.authHeaders()
      })
      .toPromise()
      .then(response => {
        let data = response.json();
        let order = Order.of(data);
        if (!order.order_no || order.order_no.length === 0) {
          return null;
        }
        this.currentOrder = order;
        return order;
      })
      .catch(this.handleError);
  }

  fetchAvailablePincodes() {
    return this.http.get(
      `${AppConfig.PINCODE_URL}`,
      {
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

  public getMyOrders(searchUrl: string, searchData: MyOrderSearchModel): Promise<MyOrderSearchResult> {
    let headers = {
      headers: this.authHeaders()
    };
    if (searchUrl === null || searchUrl.length === 0) {
      searchUrl = AppConfig.MY_ORDERS_URL;
      headers['search'] = searchData.toUrlSearchParams();
    } else {
      searchUrl = AppConfig.getBaseHost() + searchUrl;
    }

    return this.http.get(searchUrl, headers)
      .toPromise()
      .then(response => {
        let data = response.json();
        let result = MyOrderSearchResult.of(data);
        return result;
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
