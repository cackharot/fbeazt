import { Injectable } from '@angular/core';
import { Headers, URLSearchParams, Http } from '@angular/http';

import { Product } from '../model/product';

import 'rxjs/add/operator/toPromise';

export class ProductSearchModel{
  searchText:string;
  onlyVeg:boolean=false;
  category:string;
  sortBy:string = 'Rating';
  sortDirection:string = 'ASC';
  pageNo:number = 1;
  pageSize:number = 50;

  constructor(searchText:string=null,
    onlyVeg:boolean = false,
    category:string = '',
    pageNo:number = 1,
    pageSize:number = 50){
    this.searchText = searchText;
    this.category = category;
    this.onlyVeg = onlyVeg;
    this.pageNo = pageNo;
    this.pageSize = pageSize;
  }
}

@Injectable()
export class ProductService {
  private productsUrl = 'http://localhost:4000/api/products';
  private productUrl = 'http://localhost:4000/api/product';

  constructor(private http: Http) { }

  searchAll(data:ProductSearchModel): Promise<Product[]> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('filter_text', data.searchText);
    params.set('only_veg', data.onlyVeg.toString());
    params.set('sort_by', data.sortBy);
    params.set('sort_direction', data.sortDirection);
    params.set('page_no', data.pageNo.toString());
    params.set('page_size', data.pageSize.toString());

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
