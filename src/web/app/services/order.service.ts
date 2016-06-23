import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import {LocalStorage, SessionStorage} from "angular2-localstorage/WebStorage";

import { Product } from '../model/product';
import { Order, LineItem, DeliveryDetails } from '../model/order';

@Injectable()
export class OrderService {
  // Observable string sources
  @LocalStorage() private currentOrder: Order = new Order();
  private itemAddedSource = new Subject<LineItem>();
  private deliveryUpdatedSource = new Subject<DeliveryDetails>();
  private orderConfirmedSource = new Subject<boolean>();

  // Observable string streams
  itemAdded$ = this.itemAddedSource.asObservable();
  deliveryUpdated$ = this.deliveryUpdatedSource.asObservable();
  orderConfirmed$ = this.orderConfirmedSource.asObservable();

  constructor(){
    if(this.currentOrder.constructor.name != 'Order'){
      this.currentOrder = new Order(this.currentOrder);
    }
  }

  addLineItem(item: LineItem) {
    this.currentOrder.addItem(item);
    this.itemAddedSource.next(item);
  }

  updateDeliveryDetails(deliveryDetails: DeliveryDetails) {
    this.currentOrder.delivery_details = deliveryDetails;
    this.deliveryUpdatedSource.next(deliveryDetails);
  }

  getOrder(){
    return this.currentOrder;
  }

  getTotalQuantity(){
    return this.currentOrder.getTotalQuantity();
  }

  getTotalAmount(){
    return this.currentOrder.getTotalAmount();
  }

  confirmOrder() {
    this.currentOrder.confirm();
    this.orderConfirmedSource.next(true);
    this.currentOrder = new Order();
  }

  resetOrder(){
    this.currentOrder = new Order();
    this.orderConfirmedSource.next(false);
  }
}
