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
var store_service_1 = require('./services/store.service');
var RestaurantComponent = (function () {
    function RestaurantComponent(storeService, router) {
        this.storeService = storeService;
        this.router = router;
    }
    RestaurantComponent.prototype.ngOnInit = function () {
        this.getRestaurants();
    };
    RestaurantComponent.prototype.getRestaurants = function () {
        var _this = this;
        this.storeService.search().then(function (x) {
            _this.restaurants = x;
        });
    };
    RestaurantComponent.prototype.onSelect = function (restaurant) {
        this.selectedRestaurant = restaurant;
        var link = ['RestaurantDetail', { id: restaurant._id.$oid }];
        this.router.navigate(link);
    };
    RestaurantComponent = __decorate([
        core_1.Component({
            selector: 'restaurants',
            templateUrl: 'templates/restaurants.html',
        }), 
        __metadata('design:paramtypes', [store_service_1.StoreService, router_deprecated_1.Router])
    ], RestaurantComponent);
    return RestaurantComponent;
}());
exports.RestaurantComponent = RestaurantComponent;
//# sourceMappingURL=restaurant.component.js.map