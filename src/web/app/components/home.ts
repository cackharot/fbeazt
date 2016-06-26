import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FORM_DIRECTIVES, Control } from '@angular/common';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { LocalStorage, SessionStorage } from "angular2-localstorage/WebStorage";

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { Tab } from './tab';
import { Tabs } from './tabs';

import { OrderService } from '../services/order.service';
import { StoreSearchModel, StoreService } from '../services/store.service';
import { ProductSearchModel, ProductService } from '../services/product.service';

import { RestaurantComponent } from '../restaurant.component';
import { ProductListComponent } from './productlist';

import { Restaurant } from '../model/restaurant';
import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'home-page',
  templateUrl: 'templates/home.html',
  directives: [FORM_DIRECTIVES, ROUTER_DIRECTIVES, RestaurantComponent, ProductListComponent],
})
export class HomeComponent implements OnInit {
  @SessionStorage() searchText:string = '';
  @SessionStorage() userLocation:string = '';
  @SessionStorage() userPincode:string = '';
  @SessionStorage() onlyVeg:boolean = false;
  @SessionStorage() activeTab:string = 'Restaurant';
  searchCtrl:Control = new Control('');
  submitted:boolean = false;
  restaurants:Restaurant[];
  products:Product[];
  errorMsg:string;

  constructor(private router: Router,
    private productService: ProductService,
    private orderService: OrderService,
    private storeService: StoreService) {
  }

  ngOnInit() {
    this.searchCtrl.valueChanges
                 .debounceTime(400)
                 .distinctUntilChanged()
                 .subscribe(term => {
                   this.searchText = term;
                   this.search();
                 });
  }

  search(){
    if(this.searchText == null
      || this.searchText.length < 3){
      return;
    }
    this.submitted = true;
    this.searchRestaurants();
    this.searchProducts();
  }

  searchRestaurants(){
    let searchData = new StoreSearchModel(this.searchText,
      this.onlyVeg,
      this.userLocation,
      this.userPincode);
    this.storeService.search(searchData).then(x=>{
      this.restaurants = x;
      if(x && x.length > 0){
        this.activeTab = 'Restaurant';
      }
    })
    .catch(errMsg => this.errorMsg = errMsg);
  }

  searchProducts(){
    this.productService.searchAll(new ProductSearchModel(this.searchText, this.onlyVeg))
    .then(x=>{
      this.products = x;
      if(x && x.length > 0){
        this.activeTab = 'Product';
      }
    })
    .catch(errMsg => this.errorMsg = errMsg);
  }

  activateTab(id:string){
    this.activeTab = id;
  }

  addToCart(item: Product){
    this.orderService.addItem(item);
  }
}
