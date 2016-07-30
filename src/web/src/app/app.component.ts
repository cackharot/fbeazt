import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';

import { CartSummaryComponent } from './cartsummary/cartsummary.component';
import { RestaurantComponent } from './restaurant/restaurant.component';

import { SpinnerComponent } from './spinner/spinner.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: './app.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent, CartSummaryComponent, RestaurantComponent],
  providers: [StoreService, ProductService, OrderService]
})
export class AppComponent {
}
