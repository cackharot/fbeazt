import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES } from '@angular/router';

import { Tab } from '../components/tab';
import { Tabs } from '../components/tabs';
import { ProductListComponent } from '../productlist/productlist.component';
import { SpinnerComponent } from '../spinner/spinner.component';

import { StoreService } from '../services/store.service';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { Restaurant } from '../model/restaurant';

import { Product, Category } from '../model/product';

import { ChunkPipe } from '../pipes/chunk.pipe';

@Component({
  selector: 'restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  directives: [Tabs, Tab, ROUTER_DIRECTIVES, SpinnerComponent, ProductListComponent],
  pipes: [ChunkPipe]
})
export class RestaurantDetailComponent implements OnInit {
  storeId: string;
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  onlyVeg: boolean = false;
  isRequesting: boolean = false;
  errorMsg: any;

  constructor(
    private router: Router,
    private storeService: StoreService,
    private productService: ProductService,
    private orderService: OrderService,
    private route: ActivatedRoute) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    let id = this.route.snapshot.params['id'];
    this.storeId = id;
    this.isRequesting = true;
    this.storeService.get(id).then(x => {
      this.restaurant = x;
      this.isRequesting = false;
      this.getProducts();
    }).catch(errorMsg => {
      this.errorMsg = errorMsg;
      this.isRequesting = false;
    });
  }

  getProducts() {
    this.productService.search(this.storeId).then(items => {
      this.products = items;
      this.categories = [];
      if (this.onlyVeg) {
        this.products = this.products.filter(x => x.isVeg());
      }
      for (let i = 0; i < this.products.length; ++i) {
        let item = this.products[i];
        let category = this.categories.find(c => c.name === item.category);
        if (category === undefined) {
          let c = new Category({ name: item.category });
          c.addProduct(item);
          this.categories.push(c);
        } else {
          category.addProduct(item);
        }
        this.isRequesting = false;
      }
    }).catch(errorMsg => {
      this.errorMsg = errorMsg;
      this.isRequesting = false;
    });
  }

  addToCart(item: Product) {
    this.orderService.addItem(item);
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  filter() {
    this.getProducts();
  }
}
