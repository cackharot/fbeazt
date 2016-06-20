import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { Tabs, Tab } from './components/tabs';

import { CartSummaryComponent } from './components/cartsummary';
import { CheckoutComponent } from './components/checkout';
import { RestaurantComponent } from './restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: 'templates/app.html',
  directives: [Tabs, Tab, ROUTER_DIRECTIVES, RestaurantComponent, CartSummaryComponent],
  providers: [ROUTER_PROVIDERS, StoreService, ProductService, OrderService]
})
@RouteConfig([
  { name: 'Home', path: '/', component: RestaurantComponent, useAsDefault: true},
  { name: 'RestaurantList', path: '/restaurants', component: RestaurantComponent},
  { name: 'RestaurantDetail', path: '/restaurants/:id', component: RestaurantDetailComponent },
  { name: 'Checkout', path: '/checkout', component: CheckoutComponent },
])
export class AppComponent {
  constructor(private router: Router){}
}
