import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';
import { FaqComponent } from './faq';

import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'order_success',
  templateUrl: 'templates/order_success.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent, FaqComponent],
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
    if(this.order.order_no == null || this.order.order_no.length == 0){
      console.error("Invalid order");
      console.error(this.order);
      this.router.navigate(['Home']);
    }
    if(this.order.otp_status != 'VERIFIED'){
      console.error("Invalid order state!");
    }
  }
}
