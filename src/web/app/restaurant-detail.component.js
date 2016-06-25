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
var chunk_pipe_1 = require('./pipes/chunk.pipe');
var RestaurantDetailComponent = (function () {
    function RestaurantDetailComponent(router, storeService, productService, orderService, routeParams) {
        this.router = router;
        this.storeService = storeService;
        this.productService = productService;
        this.orderService = orderService;
        this.routeParams = routeParams;
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
                    var c = new product_1.Category({ name: item.category });
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
        var lineItem = new order_1.LineItem({
            product_id: item._id,
            name: item.name,
            store_id: item.store_id,
            store_name: this.restaurant.name,
            description: "",
            category: item.category,
            vegetarian: item.food_type[0] == 'veg',
            quantity: 1.0,
            price: item.sell_price
        });
        this.orderService.addLineItem(lineItem);
    };
    RestaurantDetailComponent.prototype.goBack = function (id, event) {
        // event.preventDefault();
        this.router.navigate([id]);
    };
    RestaurantDetailComponent.prototype.handleError = function (err) {
        console.log(err);
        this.error = err;
    };
    RestaurantDetailComponent = __decorate([
        core_1.Component({
            selector: 'restaurant-detail',
            templateUrl: 'templates/restaurant-detail.html',
            directives: [tabs_1.Tabs, tabs_1.Tab, router_deprecated_1.ROUTER_DIRECTIVES],
            pipes: [chunk_pipe_1.ChunkPipe],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, store_service_1.StoreService, product_service_1.ProductService, order_service_1.OrderService, router_deprecated_1.RouteParams])
    ], RestaurantDetailComponent);
    return RestaurantDetailComponent;
}());
exports.RestaurantDetailComponent = RestaurantDetailComponent;
//# sourceMappingURL=restaurant-detail.component.js.map