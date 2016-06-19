import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams } from '@angular/router-deprecated';

import { StoreService } from './services/store.service';
import { Restaurant } from './model/restaurant';

@Component({
  selector: 'restaurant-detail',
  templateUrl: 'templates/restaurant-detail.html',
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: Restaurant;
  error: any;
  @Output() close = new EventEmitter();

  constructor(
    private storeService: StoreService,
    private routeParams: RouteParams) { }

  ngOnInit() {
    let id = this.routeParams.get('id');
    this.storeService.get(id).then(x=>{
      this.restaurant = x;
    })
    .catch(err=> {
      console.log(err);
      this.error = err;
    });
  }

  goBack() {
    this.close.emit(this.restaurant);
    window.history.back();
  }
}
