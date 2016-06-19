import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { RestaurantComponent } from './restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';

@Component({
  selector: 'fb-app',
  templateUrl: 'templates/app.html',
  directives: [ROUTER_DIRECTIVES, RestaurantComponent],
  providers: [ROUTER_PROVIDERS, StoreService, ProductService]
})
@RouteConfig([
  { name: 'RestaurantList', path: '/restaurants', component: RestaurantComponent, useAsDefault: true},
  { name: 'RestaurantDetail', path: 'restaurants/:id', component: RestaurantDetailComponent }
])
export class AppComponent { }
