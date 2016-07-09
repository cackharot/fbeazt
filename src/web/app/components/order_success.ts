import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';

import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'order_success',
  templateUrl: 'templates/order_success.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class OrderSuccessComponent implements OnInit {
  order: Order;
  isRequesting:boolean = false;
  error:any = null;

  constructor(private router: Router,
    private orderService: OrderService) {
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    if(this.order.otp_status != 'VERIFIED'){
      console.error("Invalid order state!");
    }
  }
}