import { Injectable } from '@angular/core';
import { URLSearchParams, Headers, Http } from '@angular/http';

import { Restaurant } from '../model/restaurant';
import { AppConfig } from '../AppConfig';

import 'rxjs/add/operator/toPromise';

export class StoreSearchModel{
  searchText:string;
  onlyVeg:boolean=false;
  onlyOpen:boolean=false;
  userPincode:number;
  userLocation:string;
  sortBy:string = 'Rating';
  sortDirection:string = 'ASC';
  pageNo:number = 1;
  pageSize:number = 10;
  store_ids:string[];

  constructor(searchText:string=null,
        onlyVeg:boolean = false,
        onlyOpen:boolean = false,
        userLocation:string = '',
        userPincode:string = '',
        pageNo:number = 1,
        pageSize:number = 10){
    this.searchText = searchText;
    this.onlyVeg = onlyVeg;
    this.onlyOpen = onlyOpen;
    this.userLocation = userLocation;
    this.userPincode = +userPincode;
    this.pageNo = pageNo;
    this.pageSize = pageSize;
    this.store_ids = [];
  }
}

@Injectable()
export class StoreService {
  private storesUrl = AppConfig.STORES_URL;  // URL to web api
  private storeUrl = AppConfig.STORE_URL;  // URL to web api

  constructor(private http: Http) { }

  search(data:StoreSearchModel): Promise<Restaurant[]> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('filter_text', data.searchText);
    params.set('store_ids', data.store_ids.join(','));
    params.set('only_veg', data.onlyVeg.toString());
    params.set('only_open', data.onlyOpen.toString());
    params.set('user_location', data.userLocation);
    params.set('user_pincode', data.userPincode.toString());
    params.set('sort_by', data.sortBy);
    params.set('sort_direction', data.sortDirection);
    params.set('page_no', data.pageNo.toString());
    params.set('page_size', data.pageSize.toString());

    return this.http.get(this.storesUrl,{search: params})
               .toPromise()
               .then(response =>{
                 return response.json().map(x => new Restaurant(x));
               })
               .catch(this.handleError);
  }

  get(id): Promise<Restaurant> {
    return this.http.get(`${this.storeUrl}/${id}`)
               .toPromise()
               .then(response => new Restaurant(response.json()))
               .catch(this.handleError);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
