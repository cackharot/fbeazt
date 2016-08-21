import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { POPOVER_DIRECTIVES } from 'ng2-popover';

import { OrderService } from '../services/order.service';

import { Product, PriceDetail } from '../model/product';

@Component({
  selector: 'price-table',
  templateUrl: './price-table.component.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES],
})
export class PriceTableComponent {
  @Input() product: Product;
  selection: PriceDetail;

  constructor(private router: Router, private orderService: OrderService) { }

  ngOnInit() {
    if (this.hasPriceTable()) {
      let order = this.orderService.getOrder();
      let pd = order.getItemPriceTable(this.product._id);
      if (pd) {
        let t = this.product.price_table;
        this.selection = t.find(x => x.price === pd.price && x.no === x.no);
        this.product.selectedPriceDetail = this.selection;
      } else {
        this.selection = this.product.selectedPriceDetail;
      }
    }
  }

  hasPriceTable() {
    return this.product.price_table && this.product.price_table.length > 0
  }

  onChange(item: PriceDetail) {
    this.product.selectedPriceDetail = item;
    this.selection = item;
    this.orderService.updateItemPriceDetail(this.product._id, item);
  }
}
