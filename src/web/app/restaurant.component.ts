import { Component, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { Restaurant } from './model/restaurant';

@Component({
  selector: 'restaurants',
  templateUrl: 'templates/restaurants.html',
  directives: [ROUTER_DIRECTIVES],
})
export class RestaurantComponent implements OnInit {
  @Input() restaurants: Restaurant[];
  selectedRestaurant: Restaurant;

  constructor(private router: Router) { }

  ngOnInit() {
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
