import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { POPOVER_DIRECTIVES } from 'ng2-popover';

import { OrderService } from '../services/order.service';

import { Product } from '../model/product';

import { ChunkPipe } from '../pipes/chunk.pipe';
import { AppConfig } from '../AppConfig';

@Component({
  selector: 'product-grid',
  templateUrl: './product-grid.component.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES],
  pipes: [ChunkPipe]
})
export class ProductGridComponent {
  @Input() products: Product[];
  @Output() selectedProduct = new EventEmitter<Product>();

  constructor(private router: Router, private orderService: OrderService) { }

  getQuantity(item: Product) {
    let order = this.orderService.getOrder();
    return order.getItemQuantity(item._id);
  }

  updateQuantity(item: Product, value: number) {
    this.orderService.updateItemQuantity(item._id, value);
  }

  select(item: Product, event: any = null) {
    if (event) {
      event.preventDefault();
    }
    this.selectedProduct.emit(item);
  }
}
