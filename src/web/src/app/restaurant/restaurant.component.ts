import { Component, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { Restaurant } from '../model/restaurant';
import { StoreSearchModel, StoreSearchResponse, StoreService } from '../services/store.service';
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
  responseData: StoreSearchResponse;
  selectedRestaurant: Restaurant;
  errorMsg: string = null;
  isRequesting: boolean = false;

  constructor(private router: Router,
    private storeService: StoreService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    this.searchData.page_size = 10;
    this.search();
  }

  search(searchUrl: string = null) {
    this.isRequesting = true;
    this.storeService.search(searchUrl, this.searchData).then(x => {
      this.errorMsg = null;
      this.responseData = x;
      this.restaurants = x.items;
      this.isRequesting = false;
    }).catch(errMsg => {
      this.errorMsg = errMsg;
      this.restaurants = [];
      this.responseData = new StoreSearchResponse();
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
