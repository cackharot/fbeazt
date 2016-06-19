import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams } from '@angular/router-deprecated';
import { Tabs, Tab } from './components/tabs';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { Restaurant } from './model/restaurant';

import { Product, Category } from './model/product';

@Component({
  selector: 'restaurant-detail',
  templateUrl: 'templates/restaurant-detail.html',
  directives: [Tabs, Tab]
})
export class RestaurantDetailComponent implements OnInit {
  storeId: string;
  restaurant: Restaurant;
  categories: Category[];
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
      this.categories = [];
      for(var i=0; i < this.products.length; ++i){
        var item = this.products[i];
        var category = this.categories.find(x=>x.name == item.category);
        if(category == undefined){
          var c = new Category(item.category);
          c.addProduct(item);
          this.categories.push(c);
        }else{
          category.addProduct(item);
        }
      }
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
