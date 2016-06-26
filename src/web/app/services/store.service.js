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
var restaurant_1 = require('../model/restaurant');
require('rxjs/add/operator/toPromise');
var StoreSearchModel = (function () {
    function StoreSearchModel(searchText, onlyVeg, userLocation, userPincode, pageNo, pageSize) {
        if (searchText === void 0) { searchText = null; }
        if (onlyVeg === void 0) { onlyVeg = false; }
        if (userLocation === void 0) { userLocation = ''; }
        if (userPincode === void 0) { userPincode = ''; }
        if (pageNo === void 0) { pageNo = 1; }
        if (pageSize === void 0) { pageSize = 10; }
        this.onlyVeg = false;
        this.sortBy = 'Rating';
        this.sortDirection = 'ASC';
        this.pageNo = 1;
        this.pageSize = 10;
        this.searchText = searchText;
        this.onlyVeg = onlyVeg;
        this.userLocation = userLocation;
        this.userPincode = +userPincode;
        this.pageNo = pageNo;
        this.pageSize = pageSize;
    }
    return StoreSearchModel;
}());
exports.StoreSearchModel = StoreSearchModel;
var StoreService = (function () {
    function StoreService(http) {
        this.http = http;
        this.storesUrl = 'http://localhost:4000/api/stores'; // URL to web api
        this.storeUrl = 'http://localhost:4000/api/store'; // URL to web api
    }
    StoreService.prototype.search = function (data) {
        var params = new http_1.URLSearchParams();
        params.set('filter_text', data.searchText);
        params.set('only_veg', data.onlyVeg.toString());
        params.set('user_location', data.userLocation);
        params.set('user_pincode', data.userPincode.toString());
        params.set('sort_by', data.sortBy);
        params.set('sort_direction', data.sortDirection);
        params.set('page_no', data.pageNo.toString());
        params.set('page_size', data.pageSize.toString());
        return this.http.get(this.storesUrl, { search: params })
            .toPromise()
            .then(function (response) {
            return response.json().map(function (x) { return new restaurant_1.Restaurant(x); });
        })
            .catch(this.handleError);
    };
    StoreService.prototype.get = function (id) {
        return this.http.get(this.storeUrl + "/" + id)
            .toPromise()
            .then(function (response) { return new restaurant_1.Restaurant(response.json()); })
            .catch(this.handleError);
    };
    StoreService.prototype.handleError = function (error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    };
    StoreService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], StoreService);
    return StoreService;
}());
exports.StoreService = StoreService;
//# sourceMappingURL=store.service.js.map