import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';

import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'checkout',
  templateUrl: 'templates/checkout.html',
  directives: [ROUTER_DIRECTIVES],
})
export class CheckoutComponent implements OnInit {
  order: Order;
  orderSuccess:boolean = false;
  error:any;

  constructor(private router: Router,
    private orderService: OrderService) { 
    }

  ngOnInit() {
    this.order = this.orderService.getOrder();
  }

  resetOrder(){
    this.orderService.resetOrder();
    this.router.navigate(['Home']);
  }

  confirmOrder(){
    this.orderService.confirmOrder()
    .then(updatedOrder => {
      this.order = updatedOrder;
      this.orderSuccess = true;
    }).catch(this.handleError);
  }

  private handleError(error:any){
    console.log(error);
    this.error = error;
  }

  isEmpty(){
    return this.order && this.order.items.length == 0;
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }
}
