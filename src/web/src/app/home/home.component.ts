import { Component, OnInit } from '@angular/core';
import { FORM_DIRECTIVES, Control } from '@angular/common';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { SessionStorage } from '../libs/WebStorage';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { SpinnerComponent } from '../spinner/spinner.component';

import { OrderService } from '../services/order.service';
import { StoreSearchModel, StoreService } from '../services/store.service';
import { ProductSearchModel, ProductService } from '../services/product.service';

import { RestaurantComponent } from '../restaurant/restaurant.component';
import { ProductListComponent } from '../productlist/productlist.component';

import { Product } from '../model/product';

import { FeatureService } from '../feature';

@Component({
  selector: 'home-page',
  templateUrl: './home.component.html',
  directives: [FORM_DIRECTIVES, ROUTER_DIRECTIVES,
    SpinnerComponent, RestaurantComponent, ProductListComponent]
})
export class HomeComponent implements OnInit {
  @SessionStorage() searchText: string = '';
  @SessionStorage() userLocation: string = '';
  @SessionStorage() userPincode: string = '';
  @SessionStorage() onlyVeg: boolean = false;
  @SessionStorage() onlyOpen: boolean = false;
  @SessionStorage() activeTab: string = 'Restaurant';
  storeSearchData: StoreSearchModel = new StoreSearchModel();
  searchCtrl: Control = new Control('');
  isRequesting: boolean = false;
  products: Product[];
  popular_dishes: Product[] = [];
  errorMsg: string;

  constructor(
    private router: Router,
    public feature: FeatureService,
    private productService: ProductService,
    private orderService: OrderService,
    private storeService: StoreService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    this.searchCtrl.valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
      .subscribe(term => {
        this.searchText = term ? term.trim() : '';
        this.search();
      });
    let order = this.orderService.getOrder();
    if (order.isConfirmed()) {
      this.orderService.resetOrder();
    }
  }

  search() {
    if (this.searchText === null || this.searchText.length === 0) {
      this.searchPopularDishes();
      return;
    }
    if (this.searchText.length < 3) {
      return;
    }
    this.isRequesting = true;
    this.searchRestaurants();
    this.searchProducts();
  }

  searchRestaurants() {
    this.storeSearchData.searchText = this.searchText;
    this.storeSearchData.onlyVeg = this.onlyVeg;
    this.storeSearchData.onlyOpen = this.onlyOpen;
    this.storeSearchData.page_size = 10;
  }

  searchProducts() {
    this.productService.searchAll(new ProductSearchModel(this.searchText, this.onlyVeg))
      .then(x => {
        this.errorMsg = null;
        this.products = x;
        this.isRequesting = false;
      })
      .catch(errMsg => {
        this.errorMsg = errMsg;
        this.isRequesting = false;
      });
  }

  searchPopularDishes() {
    if (this.popular_dishes.length > 0) {
      return;
    }
    this.isRequesting = true;
    this.productService.getPopularDishes()
      .then(x => {
        this.errorMsg = null;
        this.popular_dishes = x;
        this.isRequesting = false;
      })
      .catch(errMsg => {
        this.errorMsg = errMsg;
        this.isRequesting = false;
      });
  }

  activateTab(id: string) {
    this.activeTab = id;
  }

  addToCart(item: Product) {
    this.orderService.addItem(item);
  }
}
