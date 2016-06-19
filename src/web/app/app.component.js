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
var restaurant_component_1 = require('./restaurant.component');
var restaurant_detail_component_1 = require('./restaurant-detail.component');
var store_service_1 = require('./services/store.service');
var AppComponent = (function () {
    function AppComponent() {
    }
    AppComponent = __decorate([
        core_1.Component({
            selector: 'fb-app',
            templateUrl: 'templates/app.html',
            directives: [router_deprecated_1.ROUTER_DIRECTIVES, restaurant_component_1.RestaurantComponent],
            providers: [router_deprecated_1.ROUTER_PROVIDERS, store_service_1.StoreService]
        }),
        router_deprecated_1.RouteConfig([
            { name: 'RestaurantList', path: '/restaurants', component: restaurant_component_1.RestaurantComponent, useAsDefault: true },
            { name: 'RestaurantDetail', path: 'restaurants/:id', component: restaurant_detail_component_1.RestaurantDetailComponent }
        ]), 
        __metadata('design:paramtypes', [])
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map