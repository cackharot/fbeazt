import { Injectable } from '@angular/core';
import { URLSearchParams, Http } from '@angular/http';

import { Restaurant } from '../model/restaurant';
import { AppConfig } from '../AppConfig';

import 'rxjs/add/operator/toPromise';

export class StoreSearchModel {
  searchText: string;
  onlyVeg: boolean = false;
  onlyOpen: boolean = false;
  userPincode: number;
  userLocation: string;
  sort_by: string = 'Rating';
  sort_direction: string = 'ASC';
  page_no: number = 1;
  page_size: number = 100;
  store_ids: string[];

  constructor(
    searchText: string = '',
    onlyVeg: boolean = false,
    onlyOpen: boolean = false,
    userLocation: string = '',
    userPincode: string = '',
    page_no: number = 1,
    page_size: number = 100) {
    this.searchText = searchText;
    this.onlyVeg = onlyVeg;
    this.onlyOpen = onlyOpen;
    this.userLocation = userLocation;
    this.userPincode = +userPincode;
    this.page_no = page_no;
    this.page_size = page_size;
    this.store_ids = [];
  }
}

export class StoreSearchResponse extends StoreSearchModel {
  items: Restaurant[] = [];
  total: number;
  previous: string;
  next: string;

  static of(data) {
    if (data === null || data.constructor.name === StoreSearchResponse.name) {
      return data;
    }
    return new StoreSearchResponse(data);
  }

  constructor(data = {}) {
    super();
    Object.assign(this, data);
    if (this.items && this.items.length > 0) {
      this.items = this.items.map(x => Restaurant.of(x));
    }
  }
}

@Injectable()
export class StoreService {
  private storesUrl = AppConfig.STORES_URL;
  private storeUrl = AppConfig.STORE_URL;

  constructor(private http: Http) { }

  search(searchUrl: string, data: StoreSearchModel): Promise<StoreSearchResponse> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('filter_text', data.searchText);
    params.set('store_ids', data.store_ids.join(','));
    params.set('only_veg', data.onlyVeg.toString());
    params.set('only_open', data.onlyOpen.toString());
    params.set('user_location', data.userLocation);
    params.set('user_pincode', data.userPincode.toString());
    params.set('sort_by', data.sort_by);
    params.set('sort_direction', data.sort_direction);
    params.set('page_no', data.page_no.toString());
    params.set('page_size', data.page_size.toString());

    if (!searchUrl || searchUrl.length === 0) {
      searchUrl = this.storesUrl;
    }

    if (!searchUrl.startsWith('http')) {
      searchUrl = AppConfig.getBaseHost() + searchUrl;
    }

    return this.http.get(searchUrl, { search: params })
      .toPromise()
      .then(response => {
        let storeResponse = response.json();
        let result = StoreSearchResponse.of(storeResponse);
        return result;
      })
      .catch(this.handleError);
  }

  get(id): Promise<Restaurant> {
    return this.http.get(`${this.storeUrl}/${id}`)
      .toPromise()
      .then(response => Restaurant.of(response.json()))
      .catch(this.handleError);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
