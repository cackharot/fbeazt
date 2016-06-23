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
var WebStorage_1 = require("angular2-localstorage/WebStorage");
var order_1 = require('../model/order');
var OrderService = (function () {
    function OrderService() {
        // Observable string sources
        this.currentOrder = new order_1.Order();
        this.itemAddedSource = new Subject_1.Subject();
        this.deliveryUpdatedSource = new Subject_1.Subject();
        this.orderConfirmedSource = new Subject_1.Subject();
        // Observable string streams
        this.itemAdded$ = this.itemAddedSource.asObservable();
        this.deliveryUpdated$ = this.deliveryUpdatedSource.asObservable();
        this.orderConfirmed$ = this.orderConfirmedSource.asObservable();
        if (this.currentOrder.constructor.name != 'Order') {
            this.currentOrder = new order_1.Order(this.currentOrder);
        }
    }
    OrderService.prototype.addLineItem = function (item) {
        this.currentOrder.addItem(item);
        this.itemAddedSource.next(item);
    };
    OrderService.prototype.updateDeliveryDetails = function (deliveryDetails) {
        this.currentOrder.delivery_details = deliveryDetails;
        this.deliveryUpdatedSource.next(deliveryDetails);
    };
    OrderService.prototype.getOrder = function () {
        return this.currentOrder;
    };
    OrderService.prototype.getTotalQuantity = function () {
        return this.currentOrder.getTotalQuantity();
    };
    OrderService.prototype.getTotalAmount = function () {
        return this.currentOrder.getTotalAmount();
    };
    OrderService.prototype.confirmOrder = function () {
        this.currentOrder.confirm();
        this.orderConfirmedSource.next(true);
        this.currentOrder = new order_1.Order();
    };
    OrderService.prototype.resetOrder = function () {
        this.currentOrder = new order_1.Order();
        this.orderConfirmedSource.next(false);
    };
    __decorate([
        WebStorage_1.LocalStorage(), 
        __metadata('design:type', order_1.Order)
    ], OrderService.prototype, "currentOrder", void 0);
    OrderService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], OrderService);
    return OrderService;
}());
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map