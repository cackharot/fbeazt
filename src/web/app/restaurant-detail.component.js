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
var tabs_1 = require('./components/tabs');
var store_service_1 = require('./services/store.service');
var product_service_1 = require('./services/product.service');
var order_service_1 = require('./services/order.service');
var product_1 = require('./model/product');
var order_1 = require('./model/order');
var RestaurantDetailComponent = (function () {
    function RestaurantDetailComponent(router, storeService, productService, orderService, routeParams) {
        this.router = router;
        this.storeService = storeService;
        this.productService = productService;
        this.orderService = orderService;
        this.routeParams = routeParams;
        this.close = new core_1.EventEmitter();
    }
    RestaurantDetailComponent.prototype.ngOnInit = function () {
        var _this = this;
        var id = this.routeParams.get('id');
        this.storeId = id;
        this.storeService.get(id).then(function (x) {
            _this.restaurant = x;
            _this.getProducts();
        })
            .catch(this.handleError);
    };
    RestaurantDetailComponent.prototype.getProducts = function () {
        var _this = this;
        this.productService.search(this.storeId).then(function (x) {
            _this.products = x;
            _this.categories = [];
            for (var i = 0; i < _this.products.length; ++i) {
                var item = _this.products[i];
                var category = _this.categories.find(function (x) { return x.name == item.category; });
                if (category == undefined) {
                    var c = new product_1.Category(item.category);
                    c.addProduct(item);
                    _this.categories.push(c);
                }
                else {
                    category.addProduct(item);
                }
            }
        }).catch(this.handleError);
    };
    RestaurantDetailComponent.prototype.addToCart = function (item, event) {
        event.preventDefault();
        var lineItem = new order_1.LineItem(item._id, item.name, "", item.category, item.food_type[0], 1.0, item.sell_price);
        this.orderService.addLineItem(lineItem);
    };
    RestaurantDetailComponent.prototype.goBack = function (id) {
        this.close.emit(this.restaurant);
        this.router.navigate([id]);
    };
    RestaurantDetailComponent.prototype.handleError = function (err) {
        console.log(err);
        this.error = err;
    };
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RestaurantDetailComponent.prototype, "close", void 0);
    RestaurantDetailComponent = __decorate([
        core_1.Component({
            selector: 'restaurant-detail',
            templateUrl: 'templates/restaurant-detail.html',
            directives: [tabs_1.Tabs, tabs_1.Tab, router_deprecated_1.ROUTER_DIRECTIVES],
            providers: [router_deprecated_1.ROUTER_PROVIDERS]
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, store_service_1.StoreService, product_service_1.ProductService, order_service_1.OrderService, router_deprecated_1.RouteParams])
    ], RestaurantDetailComponent);
    return RestaurantDetailComponent;
}());
exports.RestaurantDetailComponent = RestaurantDetailComponent;
//# sourceMappingURL=restaurant-detail.component.js.map