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
var Subject_1 = require('rxjs/Subject');
var http_1 = require('@angular/http');
var WebStorage_1 = require("angular2-localstorage/WebStorage");
var order_1 = require('../model/order');
var OrderService = (function () {
    function OrderService(http) {
        this.http = http;
        // Observable string sources
        this.currentOrder = new order_1.Order();
        this.itemAddedSource = new Subject_1.Subject();
        this.deliveryUpdatedSource = new Subject_1.Subject();
        this.orderConfirmedSource = new Subject_1.Subject();
        this.orderResetedSource = new Subject_1.Subject();
        this.orderUrl = 'http://localhost:4000/api/order';
        // Observable string streams
        this.itemAdded$ = this.itemAddedSource.asObservable();
        this.deliveryUpdated$ = this.deliveryUpdatedSource.asObservable();
        this.orderConfirmed$ = this.orderConfirmedSource.asObservable();
        this.orderReseted$ = this.orderResetedSource.asObservable();
        if (this.currentOrder.constructor.name != 'Order') {
            this.currentOrder = new order_1.Order(this.currentOrder);
        }
    }
    OrderService.prototype.addLineItem = function (item) {
        this.currentOrder.addItem(item);
        this.itemAddedSource.next(item);
    };
    OrderService.prototype.addItem = function (item) {
        var lineItem = new order_1.LineItem({
            product_id: item._id,
            name: item.name,
            store_id: item.store_id,
            store_name: "",
            description: "",
            category: item.category,
            vegetarian: item.food_type[0] == 'veg',
            quantity: 1.0,
            price: item.sell_price
        });
        this.addLineItem(lineItem);
    };
    OrderService.prototype.updateDeliveryDetails = function (deliveryDetails) {
        this.currentOrder.delivery_details = deliveryDetails;
        this.deliveryUpdatedSource.next(deliveryDetails);
    };
    OrderService.prototype.getOrder = function () {
        return this.currentOrder;
    };
    OrderService.prototype.confirmOrder = function () {
        var _this = this;
        this.currentOrder.confirm();
        return this.http.post(this.orderUrl + "/-1", this.currentOrder)
            .toPromise()
            .then(function (response) {
            console.log(response.json());
            var updatedOrder = new order_1.Order(response.json().data);
            _this.orderConfirmedSource.next(updatedOrder);
            _this.currentOrder = updatedOrder;
            return updatedOrder;
        })
            .catch(this.handleError);
    };
    OrderService.prototype.resetOrder = function () {
        this.currentOrder = new order_1.Order();
        this.orderResetedSource.next(this.currentOrder);
    };
    OrderService.prototype.handleError = function (error) {
        console.error('An error occurred', error);
        return Promise.reject(error.json().message || error);
    };
    __decorate([
        WebStorage_1.LocalStorage(), 
        __metadata('design:type', order_1.Order)
    ], OrderService.prototype, "currentOrder", void 0);
    OrderService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], OrderService);
    return OrderService;
}());
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map