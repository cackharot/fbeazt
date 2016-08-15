import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES } from '@angular/router';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from '../spinner/spinner.component';

import { DateTimePipe } from '../pipes/datetime.pipe';

import { Order } from '../model/order';

@Component({
  selector: 'my-order',
  templateUrl: './my-order.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
  pipes: [DateTimePipe]
})
export class MyOrderComponent implements OnInit {
  isRequesting: boolean = false;
  errorMsg: string;
  orders: Order[] = [];
  showMap: any = {};

  constructor(private orderService: OrderService,
              private router: Router,
              private route: ActivatedRoute) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    this.searchOrder();
  }

  searchOrder() {
    this.isRequesting = true;
    this.orderService.getMyOrders()
      .then(x => {
        this.orders = x;
        this.isRequesting = false;
        this.errorMsg = null;
      })
      .catch(errorMsg => {
        this.errorMsg = errorMsg;
        this.isRequesting = false;
      });
  }

  toggleOrderDetails(order) {
    if (this.showMap[order.order_no] === undefined) {
      this.showMap[order.order_no] = true;
    } else {
      this.showMap[order.order_no] = !this.showMap[order.order_no];
    }
  }

  canShowOrderDetails(order: Order) {
    return this.showMap[order.order_no] === true;
  }
}