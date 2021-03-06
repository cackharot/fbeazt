import { Component, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { FaqComponent } from '../faq/faq.component';

import { Order } from '../model/order';

@Component({
  selector: 'order_success',
  templateUrl: './order-success.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent, FaqComponent]
})
export class OrderSuccessComponent implements OnInit {
  order: Order;
  isRequesting: boolean = false;
  error: any = null;

  constructor(
    private router: Router,
    private orderService: OrderService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    this.isRequesting = true;
    this.orderService.reloadOrder()
      .then(data => {
        this.isRequesting = false;
        this.order = data;
        if (this.order === null || this.order.order_no === null || this.order.order_no.length === 0) {
          console.error('Invalid order');
          console.error(this.order);
          this.router.navigate(['home']);
        }
        if (this.order.otp_status !== 'VERIFIED') {
          console.error('Invalid order state!');
          this.router.navigate(['home']);
        }
      })
      .catch(e => {
        this.isRequesting = false;
        this.error = e;
      });
  }
}
