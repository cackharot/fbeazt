"use strict";
var base_1 = require("./base");
var restaurant_1 = require("./restaurant");
var Product = (function () {
    function Product(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.store_id = new base_1.ObjectId();
        this.store = new restaurant_1.Restaurant();
        this.tenant_id = new base_1.ObjectId();
        Object.assign(this, data);
        this._id = base_1.ObjectId.of(this._id);
        this.store_id = base_1.ObjectId.of(this.store_id);
        this.store = restaurant_1.Restaurant.of(this.store);
    }
    Product.prototype.isVeg = function () {
        return this.food_type.filter(function (x) { return x == 'veg'; }).length == 1;
    };
    Product.prototype.isNonVeg = function () {
        return !this.isVeg();
    };
    Product.prototype.isAvailable = function () {
        if (this.status == false)
            return false;
        if (this.store.isHoliday() || this.store.isClosed()) {
            return false;
        }
        return true;
    };
    Product.of = function (data) {
        if (data == null || data.constructor.name == Product.name) {
            return data;
        }
        return new Product(data);
    };
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