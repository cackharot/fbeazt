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
var common_1 = require('@angular/common');
var router_deprecated_1 = require('@angular/router-deprecated');
var WebStorage_1 = require("angular2-localstorage/WebStorage");
require('rxjs/add/operator/map');
require('rxjs/add/operator/debounceTime');
require('rxjs/add/operator/distinctUntilChanged');
require('rxjs/add/operator/switchMap');
var order_service_1 = require('../services/order.service');
var store_service_1 = require('../services/store.service');
var product_service_1 = require('../services/product.service');
var restaurant_component_1 = require('../restaurant.component');
var productlist_1 = require('./productlist');
var HomeComponent = (function () {
    function HomeComponent(router, productService, orderService, storeService) {
        this.router = router;
        this.productService = productService;
        this.orderService = orderService;
        this.storeService = storeService;
        this.searchText = '';
        this.userLocation = '';
        this.userPincode = '';
        this.onlyVeg = false;
        this.activeTab = 'Restaurant';
        this.searchCtrl = new common_1.Control('');
        this.submitted = false;
    }
    HomeComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.searchCtrl.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe(function (term) {
            _this.searchText = term;
            _this.search();
        });
    };
    HomeComponent.prototype.search = function () {
        if (this.searchText == null
            || this.searchText.length < 3) {
            return;
        }
        this.submitted = true;
        this.searchRestaurants();
        this.searchProducts();
    };
    HomeComponent.prototype.searchRestaurants = function () {
        var _this = this;
        var searchData = new store_service_1.StoreSearchModel(this.searchText, this.onlyVeg, this.userLocation, this.userPincode);
        this.storeService.search(searchData).then(function (x) {
            _this.restaurants = x;
            if (x && x.length > 0) {
                _this.activeTab = 'Restaurant';
            }
        })
            .catch(this.handleError);
    };
    HomeComponent.prototype.searchProducts = function () {
        var _this = this;
        this.productService.searchAll(new product_service_1.ProductSearchModel(this.searchText, this.onlyVeg))
            .then(function (x) {
            _this.products = x;
            if (x && x.length > 0) {
                _this.activeTab = 'Product';
            }
        })
            .catch(this.handleError);
    };
    HomeComponent.prototype.activateTab = function (id) {
        this.activeTab = id;
    };
    HomeComponent.prototype.addToCart = function (item) {
        this.orderService.addItem(item);
    };
    HomeComponent.prototype.handleError = function (errorMsg) {
        this.errorMsg = errorMsg;
    };
    __decorate([
        WebStorage_1.SessionStorage(), 
        __metadata('design:type', String)
    ], HomeComponent.prototype, "searchText", void 0);
    __decorate([
        WebStorage_1.SessionStorage(), 
        __metadata('design:type', String)
    ], HomeComponent.prototype, "userLocation", void 0);
    __decorate([
        WebStorage_1.SessionStorage(), 
        __metadata('design:type', String)
    ], HomeComponent.prototype, "userPincode", void 0);
    __decorate([
        WebStorage_1.SessionStorage(), 
        __metadata('design:type', Boolean)
    ], HomeComponent.prototype, "onlyVeg", void 0);
    __decorate([
        WebStorage_1.SessionStorage(), 
        __metadata('design:type', String)
    ], HomeComponent.prototype, "activeTab", void 0);
    HomeComponent = __decorate([
        core_1.Component({
            selector: 'home-page',
            templateUrl: 'templates/home.html',
            directives: [common_1.FORM_DIRECTIVES, router_deprecated_1.ROUTER_DIRECTIVES, restaurant_component_1.RestaurantComponent, productlist_1.ProductListComponent],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, product_service_1.ProductService, order_service_1.OrderService, store_service_1.StoreService])
    ], HomeComponent);
    return HomeComponent;
}());
exports.HomeComponent = HomeComponent;
//# sourceMappingURL=home.js.map