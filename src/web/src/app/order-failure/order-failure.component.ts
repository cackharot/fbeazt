import {Order} from '../model/order';
import {Component, OnInit} from '@angular/core';
import {ROUTER_DIRECTIVES, Router} from '@angular/router';

import {SpinnerComponent} from '../spinner/spinner.component';
import {OrderService} from '../services/order.service';

@Component({
  selector: 'order-failure',
  templateUrl: './order-failure.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent]
})
export class OrderFailureComponent implements OnInit {
  private order: Order;
  isRequesting: boolean = false;
  errorMsg: string = null;

  constructor(private router: Router, private orderService: OrderService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    })
  }

  ngOnInit() {
    this.loadOrder();
  }

  loadOrder() {
    this.isRequesting = true;
    this.orderService.reloadOrder()
      .then(x => {
        this.order = x;
        if (x === undefined || x.order_no.length === 0) {
          this.router.navigate(['/home']);
        }
        this.isRequesting = false;
      })
      .catch(e => {
        if (e !== 'Invalid order') {
          this.errorMsg = e;
        }
        this.isRequesting = false;
      });
  }
}
