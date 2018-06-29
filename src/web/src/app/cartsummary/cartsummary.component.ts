import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES } from '@angular/router';

import { OrderService } from '../services/order.service';

import { Order } from '../model/order';

@Component({
  selector: 'cart-summary',
  templateUrl: './cartsummary.component.html',
  directives: [ROUTER_DIRECTIVES]
})
export class CartSummaryComponent implements OnInit {
  currentOrder: Order;
  totalQuantity: number;
  totalAmount: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService) { }

  ngOnInit() {
    this.currentOrder = this.orderService.getOrder();
    if (!this.canShow() && this.currentOrder.isConfirmed()) {
      this.orderService.resetOrder();
      this.currentOrder = this.orderService.getOrder();
    }
    this.update();
    this.orderService.itemAdded$.subscribe((x) => {
      this.update();
    });
    this.orderService.orderUpdated$.subscribe((x) => {
      this.update();
    });
    this.orderService.orderReseted$.subscribe((x) => {
      this.currentOrder = x;
      this.update();
    });
  }

  componentDidMount() {
    this.update();
  }

  canShow(): boolean {
    let currentPath = this.router.url;
    let count = ['/checkout', '/otp', '/order_success', '/track']
      .filter(x => currentPath.startsWith(x.toLowerCase())).length;
    return count === 0;
  }

  update() {
    this.totalQuantity = this.currentOrder.getTotalQuantity();
    this.totalAmount = this.currentOrder.getTotalAmount();
  }

  navigateToCheckout(event: any) {
    this.router.navigate(['checkout']);
  }
}
