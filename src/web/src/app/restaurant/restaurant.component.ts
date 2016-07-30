import { Component, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { Restaurant } from '../model/restaurant';

@Component({
  selector: 'restaurants',
  templateUrl: './restaurant.component.html',
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
    this.router.navigate(['/restaurant', restaurant._id.$oid]);
  }
}
