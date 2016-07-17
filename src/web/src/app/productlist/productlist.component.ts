import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { POPOVER_DIRECTIVES } from "ng2-popover";

import { OrderService } from '../services/order.service';
import { ProductSearchModel, ProductService } from '../services/product.service';

import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

import { ChunkPipe } from '../pipes/chunk.pipe';

@Component({
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES],
  pipes: [ChunkPipe],
})
export class ProductListComponent implements OnInit {
  @Input() products:Product[];
  @Output() selectedProduct = new EventEmitter<Product>();
  selection:Product;

  constructor(private router: Router, private orderService: OrderService) { }

  ngOnInit() {
  }

  getQuantity(item:Product){
    let order = this.orderService.getOrder();
    return order.getItemQuantity(item._id);
  }

  updateQuantity(item:Product, value:number){
    this.orderService.updateItemQuantity(item._id, value);
  }

  select(item: Product, event: any=null){
    if(event) event.preventDefault();
    this.selection=item;
    this.selectedProduct.emit(item);
  }
}
