"use strict";
var Product = (function () {
    function Product(data) {
        if (data === void 0) { data = {}; }
        Object.assign(this, data);
    }
    return Product;
}());
exports.Product = Product;
var Category = (function () {
    function Category(data) {
        if (data === void 0) { data = {}; }
        this.products = [];
        Object.assign(this, data);
        if (this.products.length > 0) {
            this.products = this.products.map(function (x) { return new Product(x); });
        }
    }
    Category.prototype.addProduct = function (item) {
        this.products.push(item);
    };
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=product.js.map