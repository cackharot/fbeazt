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
var router_deprecated_1 = require('@angular/router-deprecated');
var order_service_1 = require('../services/order.service');
var store_service_1 = require('../services/store.service');
var product_service_1 = require('../services/product.service');
var restaurant_component_1 = require('../restaurant.component');
var HomeComponent = (function () {
    function HomeComponent(router, productService, orderService, storeService) {
        this.router = router;
        this.productService = productService;
        this.orderService = orderService;
        this.storeService = storeService;
        this.onlyVeg = false;
    }
    HomeComponent.prototype.ngOnInit = function () {
    };
    HomeComponent.prototype.search = function () {
        this.searchRestaurants();
        this.searchProducts();
    };
    HomeComponent.prototype.searchRestaurants = function () {
        var _this = this;
        this.storeService.search({
            'searchText': this.searchText,
            'userPincdoe': this.userPincode,
            'userLocation': this.userLocation,
            'onlyVeg': this.onlyVeg,
            'sort_by': 'Rating',
            'sort_direction': 'ASC'
        }).then(function (x) {
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
            if (_this.activeTab == null && x && x.length > 0) {
                _this.activeTab = 'Product';
            }
        })
            .catch(this.handleError);
    };
    HomeComponent.prototype.activateTab = function (id) {
        this.activeTab = id;
    };
    HomeComponent.prototype.handleError = function (errorMsg) {
        this.errorMsg = errorMsg;
    };
    HomeComponent = __decorate([
        core_1.Component({
            selector: 'home-page',
            templateUrl: 'templates/home.html',
            directives: [router_deprecated_1.ROUTER_DIRECTIVES, restaurant_component_1.RestaurantComponent],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, product_service_1.ProductService, order_service_1.OrderService, store_service_1.StoreService])
    ], HomeComponent);
    return HomeComponent;
}());
exports.HomeComponent = HomeComponent;
//# sourceMappingURL=home.js.map