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
var CheckoutComponent = (function () {
    function CheckoutComponent(router, orderService) {
        this.router = router;
        this.orderService = orderService;
        this.orderSuccess = false;
    }
    CheckoutComponent.prototype.ngOnInit = function () {
        this.order = this.orderService.getOrder();
    };
    CheckoutComponent.prototype.resetOrder = function () {
        this.orderService.resetOrder();
        this.router.navigate(['Home']);
    };
    CheckoutComponent.prototype.confirmOrder = function () {
        var _this = this;
        this.orderService.confirmOrder()
            .then(function (updatedOrder) {
            _this.order = updatedOrder;
            _this.orderSuccess = true;
        }).catch(this.handleError);
    };
    CheckoutComponent.prototype.handleError = function (error) {
        console.log(error);
        this.error = error;
    };
    CheckoutComponent.prototype.isEmpty = function () {
        return this.order && this.order.items.length == 0;
    };
    CheckoutComponent.prototype.goBack = function (id) {
        this.router.navigate([id]);
    };
    CheckoutComponent = __decorate([
        core_1.Component({
            selector: 'checkout',
            templateUrl: 'templates/checkout.html',
            directives: [router_deprecated_1.ROUTER_DIRECTIVES],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router, order_service_1.OrderService])
    ], CheckoutComponent);
    return CheckoutComponent;
}());
exports.CheckoutComponent = CheckoutComponent;
//# sourceMappingURL=checkout.js.map