import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { Tabs, Tab } from './components/tabs';

import { RestaurantComponent } from './restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: 'templates/app.html',
  directives: [Tabs, Tab, ROUTER_DIRECTIVES, RestaurantComponent],
  providers: [ROUTER_PROVIDERS, StoreService, ProductService, OrderService]
})
@RouteConfig([
  { name: 'RestaurantList', path: '/restaurants', component: RestaurantComponent, useAsDefault: true},
  { name: 'RestaurantDetail', path: 'restaurants/:id', component: RestaurantDetailComponent }
])
export class AppComponent { }
