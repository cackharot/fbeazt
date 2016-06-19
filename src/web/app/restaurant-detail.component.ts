import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams } from '@angular/router-deprecated';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { Restaurant } from './model/restaurant';

@Component({
  selector: 'restaurant-detail',
  templateUrl: 'templates/restaurant-detail.html',
})
export class RestaurantDetailComponent implements OnInit {
  storeId: string;
  restaurant: Restaurant;
  categories: string[];
  products: any[];
  error: any;
  @Output() close = new EventEmitter();

  constructor(
    private storeService: StoreService,
    private productService: ProductService,
    private routeParams: RouteParams) { }

  ngOnInit() {
    let id = this.routeParams.get('id');
    this.storeId = id;
    this.storeService.get(id).then(x=>{
      this.restaurant = x;
      this.getProducts();
    })
    .catch(this.handleError);
  }

  getProducts(){
    this.productService.search(this.storeId).then(x=>{
      this.products = x;
      this.categories = ['indian'];
    }).catch(this.handleError);
  }

  goBack() {
    this.close.emit(this.restaurant);
    window.history.back();
  }

  private handleError(err: any){
    console.log(err);
    this.error = err;
  }
}
