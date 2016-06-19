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
var RestaurantDetailComponent = (function () {
    function RestaurantDetailComponent(storeService, routeParams) {
        this.storeService = storeService;
        this.routeParams = routeParams;
        this.close = new core_1.EventEmitter();
    }
    RestaurantDetailComponent.prototype.ngOnInit = function () {
        var _this = this;
        var id = this.routeParams.get('id');
        this.storeService.get(id).then(function (x) {
            _this.restaurant = x;
        })
            .catch(function (err) {
            console.log(err);
            _this.error = err;
        });
    };
    RestaurantDetailComponent.prototype.goBack = function () {
        this.close.emit(this.restaurant);
        window.history.back();
    };
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RestaurantDetailComponent.prototype, "close", void 0);
    RestaurantDetailComponent = __decorate([
        core_1.Component({
            selector: 'restaurant-detail',
            templateUrl: 'templates/restaurant-detail.html',
        }), 
        __metadata('design:paramtypes', [store_service_1.StoreService, router_deprecated_1.RouteParams])
    ], RestaurantDetailComponent);
    return RestaurantDetailComponent;
}());
exports.RestaurantDetailComponent = RestaurantDetailComponent;
//# sourceMappingURL=restaurant-detail.component.js.map