"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var http_1 = require('@angular/http');
var product_1 = require('../model/product');
require('rxjs/add/operator/toPromise');
var ProductSearchModel = (function () {
    function ProductSearchModel(searchText, onlyVeg) {
        if (searchText === void 0) { searchText = null; }
        if (onlyVeg === void 0) { onlyVeg = false; }
        this.onlyVeg = false;
        this.sortBy = 'Rating';
        this.sortDirection = 'ASC';
        this.searchText = searchText;
        this.onlyVeg = onlyVeg;
    }
    return ProductSearchModel;
}());
exports.ProductSearchModel = ProductSearchModel;
var ProductService = (function () {
    function ProductService(http) {
        this.http = http;
        this.productsUrl = 'http://localhost:4000/api/products';
        this.productUrl = 'http://localhost:4000/api/product';
    }
    ProductService.prototype.searchAll = function (data) {
        var params = new http_1.URLSearchParams();
        params.set('searchText', data.searchText);
        params.set('onlyVeg', data.onlyVeg.toString());
        params.set('sortBy', data.sortBy);
        params.set('sortDirection', data.sortDirection);
        return this.http.get(this.productsUrl + "/-1", {
            search: params
        })
            .toPromise()
            .then(function (response) {
            var items = response.json().items;
            var products = items.map(function (x) { return new product_1.Product(x); });
            return products;
        })
            .catch(this.handleError);
    };
    ProductService.prototype.search = function (store_id) {
        return this.http.get(this.productsUrl + "/" + store_id)
            .toPromise()
            .then(function (response) {
            var items = response.json().items;
            var products = items.map(function (x) { return new product_1.Product(x); });
            return products;
        })
            .catch(this.handleError);
    };
    ProductService.prototype.get = function (store_id, id) {
        return this.http.get(this.productUrl + "/" + store_id + "/" + id)
            .toPromise()
            .then(function (response) { return new product_1.Product(response.json()); })
            .catch(this.handleError);
    };
    ProductService.prototype.handleError = function (error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    };
    ProductService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], ProductService);
    return ProductService;
}());
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map