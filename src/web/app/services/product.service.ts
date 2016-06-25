import { Injectable } from '@angular/core';
import { Headers, URLSearchParams, Http } from '@angular/http';

import { Product } from '../model/product';

import 'rxjs/add/operator/toPromise';

export class ProductSearchModel{
  searchText:string;
  onlyVeg:boolean=false;
  sortBy:string = 'Rating';
  sortDirection:string = 'ASC';

  constructor(searchText:string=null, onlyVeg:boolean = false){
    this.searchText = searchText;
    this.onlyVeg = onlyVeg;
  }
}

@Injectable()
export class ProductService {
  private productsUrl = 'http://localhost:4000/api/products';
  private productUrl = 'http://localhost:4000/api/product';

  constructor(private http: Http) { }

  searchAll(data:ProductSearchModel): Promise<Product[]> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('searchText', data.searchText);
    params.set('onlyVeg', data.onlyVeg.toString());
    params.set('sortBy', data.sortBy);
    params.set('sortDirection', data.sortDirection);

    return this.http.get(`${this.productsUrl}/-1`, {
                search: params
              })
               .toPromise()
               .then(response =>{
                 let items = response.json().items;
                 let products = items.map(x=> new Product(x));
                 return products;
               })
               .catch(this.handleError);
  }

  search(store_id): Promise<Product[]> {
    return this.http.get(`${this.productsUrl}/${store_id}`)
               .toPromise()
               .then(response =>{
                 let items = response.json().items;
                 let products = items.map(x=> new Product(x));
                 return products;
               })
               .catch(this.handleError);
  }

  get(store_id, id): Promise<Product> {
    return this.http.get(`${this.productUrl}/${store_id}/${id}`)
               .toPromise()
               .then(response => new Product(response.json()))
               .catch(this.handleError);
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
