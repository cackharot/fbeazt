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

  constructor(private router: Router,
    private orderService: OrderService) { 
    }

  ngOnInit() {
    this.order = this.orderService.getOrder();
  }

  isEmpty(){
    return this.order && this.order.items.length == 0;
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }
}
