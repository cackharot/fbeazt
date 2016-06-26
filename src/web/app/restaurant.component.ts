import { Component, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { StoreSearchModel, StoreService } from './services/store.service';
import { Restaurant } from './model/restaurant';

@Component({
  selector: 'restaurants',
  templateUrl: 'templates/restaurants.html',
  directives: [ROUTER_DIRECTIVES],
})
export class RestaurantComponent implements OnInit {
  @Input() restaurants: Restaurant[];
  selectedRestaurant: Restaurant;

  constructor(
    private storeService: StoreService,
    private router: Router) { }

  ngOnInit() {
    // if(this.restaurants.length == 0){
    //   this.getRestaurants();
    // }
  }

  getRestaurants(){
    this.storeService.search(new StoreSearchModel()).then(x=>{
      this.restaurants = x;
    });
  }

  isEmpty(){
    return this.restaurants == null || this.restaurants.length == 0;
  }

  onSelect(restaurant: Restaurant){
    this.selectedRestaurant = restaurant;
    let link = ['/RestaurantDetail', { id: restaurant._id.$oid }];
    this.router.navigate(link);
  }
}
