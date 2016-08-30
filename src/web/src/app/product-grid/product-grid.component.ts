import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { POPOVER_DIRECTIVES } from 'ng2-popover';

import { OrderService } from '../services/order.service';

import { Product } from '../model/product';

import { ChunkPipe } from '../pipes/chunk.pipe';
import { PriceTableComponent } from '../price-table/price-table.component';

import {ProductListComponent} from '../productlist/product-list.component';

@Component({
  selector: 'product-grid',
  templateUrl: './product-grid.component.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES, PriceTableComponent],
  pipes: [ChunkPipe]
})
export class ProductGridComponent extends ProductListComponent {

  constructor(protected router: Router, protected orderService: OrderService) {
    super(router, orderService);
  }
}
