import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { Tab } from './components/tab';
import { Tabs } from './components/tabs';
import { ProductListComponent } from './components/productlist';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { Restaurant } from './model/restaurant';

import { Product, Category } from './model/product';
import { LineItem } from './model/order';

import { ChunkPipe } from './pipes/chunk.pipe';

@Component({
  selector: 'restaurant-detail',
  templateUrl: 'templates/restaurant-detail.html',
  directives: [Tabs, Tab, ROUTER_DIRECTIVES, ProductListComponent],
  pipes: [ChunkPipe],
})
export class RestaurantDetailComponent implements OnInit {
  storeId: string;
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  onlyVeg:boolean = false;
  errorMsg: any;

  constructor(private router: Router,
    private storeService: StoreService,
    private productService: ProductService,
    private orderService: OrderService,
    private routeParams: RouteParams) { }

  ngOnInit() {
    let id = this.routeParams.get('id');
    this.storeId = id;
    this.storeService.get(id).then(x=>{
      this.restaurant = x;
      this.getProducts();
    }).catch(errorMsg=> this.errorMsg = errorMsg);
  }

  getProducts(){
    this.productService.search(this.storeId).then(x=>{
      this.products = x;
      this.categories = [];
      if(this.onlyVeg){
        this.products = this.products.filter(x=>x.isVeg());
      }
      for(var i=0; i < this.products.length; ++i){
        var item = this.products[i];
        var category = this.categories.find(x=>x.name == item.category);
        if(category == undefined){
          var c = new Category({name: item.category});
          c.addProduct(item);
          this.categories.push(c);
        }else{
          category.addProduct(item);
        }
      }
    }).catch(errorMsg=> this.errorMsg = errorMsg);
  }

  addToCart(item: Product){
    this.orderService.addItem(item);
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  filter(){
    this.getProducts();
  }
}
