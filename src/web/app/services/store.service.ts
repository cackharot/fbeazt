import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Restaurant } from '../model/restaurant';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class StoreService {
  private storesUrl = 'http://localhost:4000/api/stores';  // URL to web api
  private storeUrl = 'http://localhost:4000/api/store';  // URL to web api

  constructor(private http: Http) { }

  search(data:any={}): Promise<Restaurant[]> {
    return this.http.get(this.storesUrl)
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
