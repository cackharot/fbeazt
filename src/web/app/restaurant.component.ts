import { Component, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { StoreService } from './services/store.service';
import { Restaurant } from './model/restaurant';

@Component({
  selector: 'restaurants',
  templateUrl: 'templates/restaurants.html',
  directives: [ROUTER_DIRECTIVES],
})
export class RestaurantComponent implements OnInit {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant;

  constructor(
    private storeService: StoreService,
    private router: Router) { }

  ngOnInit() {
    this.getRestaurants();
  }

  getRestaurants(){
    this.storeService.search().then(x=>{
      this.restaurants = x;
    });
  }

  onSelect(restaurant: Restaurant){
    this.selectedRestaurant = restaurant;
    let link = ['/RestaurantDetail', { id: restaurant._id.$oid }];
    this.router.navigate(link);
  }
}
