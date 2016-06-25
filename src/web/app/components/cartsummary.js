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
var CartSummaryComponent = (function () {
    function CartSummaryComponent(router, orderService) {
        this.router = router;
        this.orderService = orderService;
    }
    CartSummaryComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.currentOrder = this.orderService.getOrder();
        this.update();
        this.orderService.itemAdded$.subscribe(function (x) {
            _this.update();
        });
        this.orderService.orderReseted$.subscribe(function (x) {
            _this.update();
        });
    };
    CartSummaryComponent.prototype.canShow = function () {
        return this.currentOrder.isConfirmed();
    };
    CartSummaryComponent.prototype.update = function () {
        this.totalQuantity = this.currentOrder.getTotalQuantity();
        this.totalAmount = this.currentOrder.getTotalAmount();
    };
    CartSummaryComponent.prototype.navigateToCheckout = function (event) {
        this.router.navigate(['Checkout']);
    };
    CartSummaryComponent = __decorate([
        core_1.Component({
            selector: 'cart-summary',
            templateUrl: 'templates/cart-summary.html',
            directives: [router_deprecated_1.ROUTER_DIRECTIVES],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, order_service_1.OrderService])
    ], CartSummaryComponent);
    return CartSummaryComponent;
}());
exports.CartSummaryComponent = CartSummaryComponent;
//# sourceMappingURL=cartsummary.js.map