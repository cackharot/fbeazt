import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { Tabs, Tab } from './components/tabs';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { Restaurant } from './model/restaurant';

import { Product, Category } from './model/product';
import { LineItem } from './model/order';

@Component({
  selector: 'restaurant-detail',
  templateUrl: 'templates/restaurant-detail.html',
  directives: [Tabs, Tab, ROUTER_DIRECTIVES],
  providers: [ROUTER_PROVIDERS]
})
export class RestaurantDetailComponent implements OnInit {
  storeId: string;
  restaurant: Restaurant;
  categories: Category[];
  products: any[];
  error: any;

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

  addToCart(item: Product, event: any){
    event.preventDefault();
    let lineItem = new LineItem(item._id,item.name,"",
      item.category,item.food_type[0],1.0,item.sell_price);
    this.orderService.addLineItem(lineItem);
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  private handleError(err: any){
    console.log(err);
    this.error = err;
  }
}
