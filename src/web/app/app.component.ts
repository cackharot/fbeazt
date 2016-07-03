import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { POPOVER_DIRECTIVES } from "ng2-popover";

import { CartSummaryComponent } from './components/cartsummary';
import { CheckoutComponent } from './components/checkout';
import { HomeComponent } from './components/home';
import { RestaurantComponent } from './restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: 'templates/app.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES, RestaurantComponent, CartSummaryComponent],
  providers: [ROUTER_PROVIDERS, StoreService, ProductService, OrderService]
})
@RouteConfig([
  { name: 'Home', path: '/', component: HomeComponent, useAsDefault: true},
  { name: 'RestaurantList', path: 'restaurants', component: RestaurantComponent},
  { name: 'RestaurantDetail', path: 'restaurant/:id', component: RestaurantDetailComponent },
  { name: 'Checkout', path: 'checkout', component: CheckoutComponent },
])
export class AppComponent {
  constructor(private router: Router){}
}
