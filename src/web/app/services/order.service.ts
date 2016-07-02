import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { Headers, Http } from '@angular/http';
import {LocalStorage, SessionStorage} from "angular2-localstorage/WebStorage";

import { Product } from '../model/product';
import { Order, LineItem, DeliveryDetails } from '../model/order';
import { AppConfig } from '../AppConfig';

@Injectable()
export class OrderService {
  @LocalStorage() private currentOrder: Order = new Order();
  private itemAddedSource = new Subject<LineItem>();
  private deliveryUpdatedSource = new Subject<DeliveryDetails>();
  private orderConfirmedSource = new Subject<Order>();
  private orderResetedSource = new Subject<Order>();
  private orderUrl:string = AppConfig.ORDER_URL;

  itemAdded$ = this.itemAddedSource.asObservable();
  deliveryUpdated$ = this.deliveryUpdatedSource.asObservable();
  orderConfirmed$ = this.orderConfirmedSource.asObservable();
  orderReseted$ = this.orderResetedSource.asObservable();

  constructor(private http: Http){
    if(this.currentOrder.constructor.name != Order.name){
      this.currentOrder = new Order(this.currentOrder);
    }
  }

  private addLineItem(item: LineItem) {
    this.currentOrder.addItem(item);
    this.itemAddedSource.next(item);
  }

  addItem(item: Product){
    if(!item.isAvailable()){
      console.log("Attempt to add not available item" + item);
      return;
    }
    let lineItem = new LineItem({
      product_id: item._id,
      name: item.name,
      store_id: item.store_id,
      store: item.store,
      description: "", //TODO
      category: item.category,
      vegetarian: item.food_type[0] == 'veg',
      quantity: 1.0,
      price: item.sell_price
    });
    this.addLineItem(lineItem);
  }

  updateDeliveryDetails(deliveryDetails: DeliveryDetails) {
    this.currentOrder.delivery_details = deliveryDetails;
    this.deliveryUpdatedSource.next(deliveryDetails);
  }

  getOrder(){
    return this.currentOrder;
  }


  confirmOrder() {
    // console.log(this.currentOrder);
    return this.http.post(`${this.orderUrl}/-1`, this.currentOrder)
      .toPromise()
      .then(response => {
        // console.log(response.json());
        let updatedOrder = new Order(response.json().data);
        this.orderConfirmedSource.next(updatedOrder);
        this.resetOrder();
        return updatedOrder;
      })
      .catch(this.handleError);
  }

  resetOrder(){
    this.currentOrder = new Order();
    this.orderResetedSource.next(this.currentOrder);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.json().message || error);
  }
}
