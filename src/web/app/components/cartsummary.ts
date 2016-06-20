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
  totalQuantity: number;
  totalAmount: number;

  constructor(private router: Router,
    private orderService: OrderService) { }

  ngOnInit() {
    this.update();
    this.orderService.itemAdded$.subscribe((x)=>{
      this.update();
    });
  }

  update(){
    this.totalQuantity = this.orderService.getTotalQuantity();
    this.totalAmount = this.orderService.getTotalAmount();
  }

  navigateToCheckout(event: any){
    this.router.navigate(['Checkout']);
  }
}
