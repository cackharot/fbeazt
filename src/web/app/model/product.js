"use strict";
var base_1 = require("./base");
var Product = (function () {
    function Product(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.store_id = new base_1.ObjectId();
        this.tenant_id = new base_1.ObjectId();
        Object.assign(this, data);
        this._id = base_1.ObjectId.of(this._id);
        this.store_id = base_1.ObjectId.of(this.store_id);
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