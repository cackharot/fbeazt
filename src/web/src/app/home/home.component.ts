import { Component, NgZone, OnInit } from '@angular/core';
import { FORM_DIRECTIVES, Control } from '@angular/common';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { SessionStorage } from '../libs/WebStorage';

import {Observable} from 'rxjs/Observable';
import { Subject }    from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { SpinnerComponent } from '../spinner/spinner.component';

import { OrderService } from '../services/order.service';
import { StoreSearchModel, StoreSearchResponse, StoreService } from '../services/store.service';
import { ProductSearchModel, ProductService } from '../services/product.service';

import { RestaurantComponent } from '../restaurant/restaurant.component';
import { ProductListComponent } from '../productlist/product-list.component';
import { ProductGridComponent } from '../product-grid/product-grid.component';

import { Product } from '../model/product';
import { Restaurant } from '../model/restaurant';

import { FeatureService } from '../feature';

@Component({
  selector: 'home-page',
  templateUrl: './home.component.html',
  directives: [FORM_DIRECTIVES, ROUTER_DIRECTIVES,
    SpinnerComponent, RestaurantComponent, ProductListComponent, ProductGridComponent]
})
export class HomeComponent implements OnInit {
  @SessionStorage() searchText: string = '';
  @SessionStorage() userLocation: string = '';
  @SessionStorage() userPincode: string = '';
  @SessionStorage() onlyVeg: boolean = false;
  @SessionStorage() onlyOpen: boolean = false;
  @SessionStorage() activeTab: string = 'Restaurant';
  storeSearchData: StoreSearchModel = new StoreSearchModel();
  storeSearchResponse: StoreSearchResponse = new StoreSearchResponse();
  searchCtrl: Control = new Control('');
  isRequesting: boolean = false;
  showList: boolean = true;
  products: Product[];
  popular_dishes: Product[] = [];
  errorMsg: string;
  mql: MediaQueryList;


  constructor(
    private router: Router,
    private zone: NgZone,
    public feature: FeatureService,
    private productService: ProductService,
    private orderService: OrderService,
    private storeService: StoreService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
    this.storeSearchData.page_size = 10;
    this.mql = window.matchMedia("screen and (max-width: 40em)");
    this.showList = this.mql.matches;
    this.mql.addListener(x => {
      zone.run(() => {
        this.showList = x.matches;
      });
    });
  }

  ngOnInit() {
    this.searchCtrl.valueChanges
      .debounceTime(600)
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

  ngOnDestroy() {
  }

  search() {
    if (this.searchText === null || this.searchText.length === 0) {
      this.searchPopularDishes();
      return;
    }
    if (this.searchText.length < 3) {
      return;
    }

    this.storeSearchData.searchText = this.searchText;
    this.storeSearchData.onlyVeg = this.onlyVeg;
    this.storeSearchData.onlyOpen = this.onlyOpen;

    this.isRequesting = true;
    this.searchRestaurants();
    this.searchProducts();
  }

  searchRestaurants(searchUrl: string = null) {
    let res: Promise<StoreSearchResponse>;
    if (searchUrl) {
      res = this.storeService.search(searchUrl, this.storeSearchData);
    } else {
      res = this.storeService.search(searchUrl, this.storeSearchData)
    }
    res.then(x => {
      this.errorMsg = null;
      this.storeSearchResponse = x;
    }).catch(errMsg => {
      this.errorMsg = errMsg;
      this.storeSearchResponse = new StoreSearchResponse();
    });
  }

  searchProducts() {
    let data = new ProductSearchModel(this.searchText, this.onlyVeg);
    data.pageSize = 10;
    this.productService.searchAll(data)
      .then(x => {
        this.errorMsg = null;
        this.products = x;
        this.isRequesting = false;
        if (this.storeSearchResponse.items.length === 0 && x.length > 0) {
          this.activateTab('Product');
        } else if (x.length == 0) {
          this.activateTab('Restaurant');
        }
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
