import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Product } from '../model/product';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class ProductService {
  private productsUrl = 'http://localhost:4000/api/products';
  private productUrl = 'http://localhost:4000/api/product';

  constructor(private http: Http) { }

  search(store_id): Promise<Product[]> {
    return this.http.get(`${this.productsUrl}/${store_id}`)
               .toPromise()
               .then(response =>{
                 return response.json().items;
               })
               .catch(this.handleError);
  }

  get(store_id, id): Promise<Product> {
    return this.http.get(`${this.productUrl}/${store_id}/${id}`)
               .toPromise()
               .then(response => response.json())
               .catch(this.handleError);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
