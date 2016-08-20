import { Component, OnInit } from '@angular/core';
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

import { RestaurantComponent } from '../restaurant/restaurant.component';

import { Product } from '../model/product';
import { Restaurant } from '../model/restaurant';

import { FeatureService } from '../feature';

@Component({
  selector: 'restaurant-list',
  templateUrl: './restaurant-list.component.html',
  directives: [FORM_DIRECTIVES, ROUTER_DIRECTIVES,
    SpinnerComponent, RestaurantComponent]
})
export class RestaurantListComponent implements OnInit {
  @SessionStorage()
  searchData: StoreSearchModel = new StoreSearchModel();
  responseData: StoreSearchResponse = new StoreSearchResponse();
  searchCtrl: Control = new Control('');
  isRequesting: boolean = false;
  restaurants: Restaurant[];
  errorMsg: string;


  constructor(
    private router: Router,
    public feature: FeatureService,
    private orderService: OrderService,
    private storeService: StoreService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
    this.searchData.page_size = 10;
  }

  ngOnInit() {
    this.searchCtrl.valueChanges
      .debounceTime(600)
      .distinctUntilChanged()
      .subscribe(term => {
        this.searchData.searchText = term ? term.trim() : '';
        this.search();
      });
    this.search();
  }

  search(searchUrl: string = null) {
    this.isRequesting = true;
    let res: Promise<StoreSearchResponse>;
    if (searchUrl) {
      res = this.storeService.search(searchUrl, this.searchData);
    } else {
      res = this.storeService.search(searchUrl, this.searchData)
    }
    res.then(x => {
      this.errorMsg = null;
      this.responseData = x;
      this.restaurants = x.items;
      this.isRequesting = false;
    }).catch(errMsg => {
      this.errorMsg = errMsg;
      this.restaurants = [];
      this.responseData = new StoreSearchResponse();
      this.isRequesting = false;
    });
  }
}
