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
var ng2_popover_1 = require("ng2-popover");
var chunk_pipe_1 = require('../pipes/chunk.pipe');
var ProductListComponent = (function () {
    function ProductListComponent(router) {
        this.router = router;
        this.selectedProduct = new core_1.EventEmitter();
    }
    ProductListComponent.prototype.ngOnInit = function () {
    };
    ProductListComponent.prototype.select = function (item, event) {
        if (event === void 0) { event = null; }
        if (event)
            event.preventDefault();
        this.selection = item;
        this.selectedProduct.emit(item);
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array)
    ], ProductListComponent.prototype, "products", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], ProductListComponent.prototype, "selectedProduct", void 0);
    ProductListComponent = __decorate([
        core_1.Component({
            selector: 'product-list',
            templateUrl: 'templates/product-list.html',
            directives: [router_deprecated_1.ROUTER_DIRECTIVES, ng2_popover_1.POPOVER_DIRECTIVES],
            pipes: [chunk_pipe_1.ChunkPipe],
        }), 
        __metadata('design:paramtypes', [router_deprecated_1.Router])
    ], ProductListComponent);
    return ProductListComponent;
}());
exports.ProductListComponent = ProductListComponent;
//# sourceMappingURL=productlist.js.map