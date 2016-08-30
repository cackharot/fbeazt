import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { POPOVER_DIRECTIVES } from 'ng2-popover';

import { OrderService } from '../services/order.service';

import { Product } from '../model/product';
import { PriceTableComponent } from '../price-table/price-table.component';

import { ChunkPipe } from '../pipes/chunk.pipe';

@Component({
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES, PriceTableComponent]
})
export class ProductListComponent {
  @Input() products: Product[];
  @Output() selectedProduct = new EventEmitter<Product>();
  selection: Product;

  constructor(protected router: Router, protected orderService: OrderService) { }

  getQuantity(item: Product, price_detail = null): number {
    let order = this.orderService.getOrder();
    return order.getItemQuantity(item._id, price_detail);
  }

  updateQuantity(item: Product, value: number, price_detail = null) {
    this.orderService.updateItemQuantity(item._id, value, price_detail);
  }

  isInCart(item: Product) {
    if (item.hasPriceTable()) {
      return item.price_table.filter(x => this.getQuantity(item, x) > 0).length > 0;
    }
    return this.getQuantity(item) > 0;
  }

  select(item: Product) {
    this.selection = item;
    this.selectedProduct.emit(item);
  }
}
