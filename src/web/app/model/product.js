"use strict";
var Product = (function () {
    function Product() {
    }
    return Product;
}());
exports.Product = Product;
var Category = (function () {
    function Category(name) {
        this.name = name;
        this.products = [];
    }
    Category.prototype.addProduct = function (item) {
        this.products.push(item);
    };
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=product.js.map