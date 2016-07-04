import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import {LocalStorage, SessionStorage} from "angular2-localstorage/WebStorage";

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';

import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'checkout',
  templateUrl: 'templates/checkout.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class CheckoutComponent implements OnInit {
  order: Order;
  orderSuccess:boolean = false;
  isRequesting:boolean = false;
  @LocalStorage() canSaveDeliveryDetails:boolean = false;
  error:any = null;

  constructor(private router: Router,
    private orderService: OrderService) {
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    this.orderSuccess = this.order.order_no && this.order.order_no.length > 0;
    this.restoreDeliveryDetails();
  }

  resetOrder(){
    this.orderService.resetOrder();
    this.router.navigate(['Home']);
  }

  confirmOrder(){
    this.saveDeliveryDetails();
    if(this.order.items.length > 0){
      this.isRequesting = true;
      this.orderService.confirmOrder()
        .then(updatedOrder => {
          this.order = updatedOrder;
          this.orderSuccess = true;
          this.error = null;
          this.isRequesting = false;
        }, errorMsg => {
          this.orderSuccess = false;
          this.error = errorMsg
          this.isRequesting = false;
        });
    }else{
      this.error = "Invalid order";
    }
  }

  private saveDeliveryDetails(){
    if(this.canSaveDeliveryDetails == false){
      localStorage.setItem("delivery_details", null);
      return;
    }
    try{
      let value = JSON.stringify(this.order.delivery_details);
      localStorage.setItem("delivery_details", value);
    }catch(e){
      console.log(e);
    }
  }

  private restoreDeliveryDetails(){
    if(this.canSaveDeliveryDetails == false){
      return;
    }
    try{
      let value = JSON.parse(localStorage.getItem("delivery_details"));
      if(value && value.name){
        this.order.delivery_details = DeliveryDetails.of(value);
      }
    }catch(e){
      console.log(e);
    }
  }

  isEmpty(){
    return this.order && this.order.items.length == 0;
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }
}
