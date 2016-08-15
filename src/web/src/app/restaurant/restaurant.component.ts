import { Component, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { Restaurant } from '../model/restaurant';
import { StoreSearchModel, StoreService } from '../services/store.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'restaurants',
  templateUrl: './restaurant.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class RestaurantComponent implements OnInit {
  @Input() restaurants: Restaurant[];
  @Input() doNotLoad: boolean = false;
  @Input() searchData: StoreSearchModel = new StoreSearchModel();
  selectedRestaurant: Restaurant;
  errorMsg: string = null;
  isRequesting: boolean = false;

  constructor(private router: Router,
    private storeService: StoreService) { }

  ngOnInit() {
    this.searchData.pageSize = 10;
    this.searchRestaurants();
  }

  searchRestaurants() {
    this.isRequesting = true;
    this.storeService.search(this.searchData).then(x => {
      this.errorMsg = null;
      this.restaurants = x;
      this.isRequesting = false;
    }).catch(errMsg => {
      this.errorMsg = errMsg;
      this.isRequesting = false;
    });
  }

  isEmpty() {
    return this.restaurants == null || this.restaurants.length == 0;
  }

  onSelect(restaurant: Restaurant) {
    this.selectedRestaurant = restaurant;
    this.router.navigate(['/restaurant', restaurant._id.$oid]);
  }
}
