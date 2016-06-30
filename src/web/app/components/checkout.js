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
var WebStorage_1 = require("angular2-localstorage/WebStorage");
var order_service_1 = require('../services/order.service');
var order_1 = require('../model/order');
var CheckoutComponent = (function () {
    function CheckoutComponent(router, orderService) {
        this.router = router;
        this.orderService = orderService;
        this.orderSuccess = false;
        this.submitted = false;
        this.canSaveDeliveryDetails = false;
        this.error = null;
    }
    CheckoutComponent.prototype.ngOnInit = function () {
        this.order = this.orderService.getOrder();
        this.orderSuccess = this.order.order_no && this.order.order_no.length > 0;
        this.restoreDeliveryDetails();
    };
    CheckoutComponent.prototype.resetOrder = function () {
        this.orderService.resetOrder();
        this.router.navigate(['Home']);
    };
    CheckoutComponent.prototype.confirmOrder = function () {
        var _this = this;
        this.saveDeliveryDetails();
        this.submitted = true;
        if (this.order.items.length > 0) {
            this.orderService.confirmOrder()
                .then(function (updatedOrder) {
                _this.order = updatedOrder;
                _this.orderSuccess = true;
                _this.error = null;
            }, function (errorMsg) {
                _this.orderSuccess = false;
                _this.error = errorMsg;
            });
        }
        else {
            this.error = "Invalid order";
        }
    };
    CheckoutComponent.prototype.saveDeliveryDetails = function () {
        if (this.canSaveDeliveryDetails == false) {
            localStorage.setItem("delivery_details", null);
            return;
        }
        try {
            var value = JSON.stringify(this.order.delivery_details);
            localStorage.setItem("delivery_details", value);
        }
        catch (e) {
            console.log(e);
        }
    };
    CheckoutComponent.prototype.restoreDeliveryDetails = function () {
        if (this.canSaveDeliveryDetails == false) {
            return;
        }
        try {
            var value = JSON.parse(localStorage.getItem("delivery_details"));
            if (value && value.name) {
                this.order.delivery_details = order_1.DeliveryDetails.of(value);
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    CheckoutComponent.prototype.isEmpty = function () {
        return this.order && this.order.items.length == 0;
    };
    CheckoutComponent.prototype.goBack = function (id) {
        this.router.navigate([id]);
    };
    __decorate([
        WebStorage_1.LocalStorage(), 
        __metadata('design:type', Boolean)
    ], CheckoutComponent.prototype, "canSaveDeliveryDetails", void 0);
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