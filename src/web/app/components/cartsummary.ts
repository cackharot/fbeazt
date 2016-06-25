import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';

import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'cart-summary',
  templateUrl: 'templates/cart-summary.html',
  directives: [ROUTER_DIRECTIVES],
})
export class CartSummaryComponent implements OnInit {
  currentOrder:Order;
  totalQuantity: number;
  totalAmount: number;

  constructor(private router: Router,
    private orderService: OrderService) { }

  ngOnInit() {
    this.currentOrder = this.orderService.getOrder();
    this.update();
    this.orderService.itemAdded$.subscribe((x)=>{
      this.update();
    });
    this.orderService.orderReseted$.subscribe((x)=>{
      this.update();
    });
  }

  canShow(){
    return this.currentOrder.isConfirmed();
  }

  update(){
    this.totalQuantity = this.currentOrder.getTotalQuantity();
    this.totalAmount = this.currentOrder.getTotalAmount();
  }

  navigateToCheckout(event: any){
    this.router.navigate(['Checkout']);
  }
}
