import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import {LocalStorage, SessionStorage} from "angular2-localstorage/WebStorage";

import { Tab } from './tab';
import { Tabs } from './tabs';

import { OrderService } from '../services/order.service';
import { StoreSearchModel, StoreService } from '../services/store.service';
import { ProductSearchModel, ProductService } from '../services/product.service';

import { RestaurantComponent } from '../restaurant.component';

import { Restaurant } from '../model/restaurant';
import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'home-page',
  templateUrl: 'templates/home.html',
  directives: [ROUTER_DIRECTIVES, RestaurantComponent],
})
export class HomeComponent implements OnInit {
  @SessionStorage() searchText:string = '';
  @SessionStorage() userLocation:string = '';
  @SessionStorage() userPincode:string = '';
  @SessionStorage() onlyVeg:boolean = false;
  restaurants:Restaurant[];
  products:Product[];
  activeTab:string;
  errorMsg:string;

  constructor(private router: Router,
    private productService: ProductService,
    private orderService: OrderService,
    private storeService: StoreService) { }

  ngOnInit() {
    if(this.searchText && this.searchText.length > 3){
      this.search();
    }
  }

  search(){
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
    .catch(this.handleError);
  }

  searchProducts(){
    this.productService.searchAll(new ProductSearchModel(this.searchText, this.onlyVeg))
    .then(x=>{
      this.products = x;
      if(this.activeTab == null && x && x.length > 0){
        this.activeTab = 'Product';
      }
    })
    .catch(this.handleError);
  }

  activateTab(id:string){
    this.activeTab = id;
  }

  handleError(errorMsg:any){
    this.errorMsg = errorMsg;
  }
}
