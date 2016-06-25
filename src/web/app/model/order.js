"use strict";
var base_1 = require("./base");
var Order = (function () {
    function Order(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.delivery_details = new DeliveryDetails();
        Object.assign(this, data);
        this._id = base_1.ObjectId.of(this._id);
        if (this.items == undefined) {
            this.items = [];
            this.status = 'NEW';
        }
        if (this.items.length > 0 && this.items[0].constructor.name != 'LineItem') {
            this.items = this.items.map(function (x) { return new LineItem(x); });
        }
        if (this.delivery_details.constructor.name != 'DeliveryDetails') {
            this.delivery_details = new DeliveryDetails(this.delivery_details);
        }
    }
    Order.prototype.confirm = function () {
        this.status = 'CONFIRMED';
    };
    Order.prototype.isConfirmed = function () {
        return this.status == 'CONFIRMED';
    };
    Order.prototype.addItem = function (item) {
        var cur_item = this.items.find(function (x) { return x.product_id == item.product_id; });
        if (cur_item == undefined) {
            item.no = this.items.length + 1;
            this.items.push(item);
        }
        else {
            cur_item.quantity++;
        }
    };
    Order.prototype.getStores = function () {
        var stores = this.items.map(function (x) { return ({ store_name: x.store_name, store_id: x.store_id }); });
        return stores;
    };
    Order.prototype.getItems = function (store_id) {
        return this.items.filter(function (x) { return x.store_id == store_id; });
    };
    Order.prototype.getTotalAmount = function () {
        var price = 0;
        this.items.forEach(function (x) { return price = price + x.getTotalPrice(); });
        return price;
    };
    Order.prototype.getTotalQuantity = function () {
        var quantity = 0;
        this.items.forEach(function (x) { return quantity = quantity + x.quantity; });
        return quantity;
    };
    return Order;
}());
exports.Order = Order;
var LineItem = (function () {
    function LineItem(data) {
        if (data === void 0) { data = {}; }
        this.product_id = new base_1.ObjectId();
        this.store_id = new base_1.ObjectId();
        Object.assign(this, data);
        this.product_id = base_1.ObjectId.of(this.product_id);
        this.store_id = base_1.ObjectId.of(this.store_id);
    }
    LineItem.prototype.getTotalPrice = function () {
        return this.price * this.quantity;
    };
    return LineItem;
}());
exports.LineItem = LineItem;
var DeliveryDetails = (function () {
    function DeliveryDetails(data) {
        if (data === void 0) { data = {}; }
        this.customer_id = new base_1.ObjectId();
        Object.assign(this, data);
        this.customer_id = base_1.ObjectId.of(this.customer_id);
    }
    return DeliveryDetails;
}());
exports.DeliveryDetails = DeliveryDetails;
//# sourceMappingURL=order.js.map