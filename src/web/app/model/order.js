"use strict";
var base_1 = require("./base");
var restaurant_1 = require("./restaurant");
var _ = require("lodash");
(function (OrderStatus) {
    OrderStatus[OrderStatus["NEW"] = 0] = "NEW";
    OrderStatus[OrderStatus["CONFIRMED"] = 1] = "CONFIRMED";
    OrderStatus[OrderStatus["PROGRESS"] = 2] = "PROGRESS";
    OrderStatus[OrderStatus["DELIVERED"] = 3] = "DELIVERED";
    OrderStatus[OrderStatus["CANCELLED"] = 4] = "CANCELLED";
    OrderStatus[OrderStatus["INVALID"] = 5] = "INVALID";
    OrderStatus[OrderStatus["UNKNOWN"] = 6] = "UNKNOWN";
})(exports.OrderStatus || (exports.OrderStatus = {}));
var OrderStatus = exports.OrderStatus;
var Order = (function () {
    function Order(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.delivery_details = new DeliveryDetails();
        this.items = [];
        this.status = OrderStatus.NEW;
        this.delivery_charges = 40;
        Object.assign(this, data);
        this._id = base_1.ObjectId.of(this._id);
        this.items = this.items.map(function (x) { return LineItem.of(x); });
        this.delivery_details = DeliveryDetails.of(this.delivery_details);
    }
    Order.prototype.confirm = function () {
        this.status = OrderStatus.CONFIRMED;
    };
    Order.prototype.isConfirmed = function () {
        return this.status == OrderStatus.CONFIRMED;
    };
    Order.prototype.addItem = function (item) {
        var cur_item = this.items.find(function (x) { return _.isEqual(x.product_id, item.product_id); });
        if (cur_item == undefined) {
            item.no = this.items.length + 1;
            this.items.push(item);
        }
        else {
            cur_item.quantity++;
        }
    };
    Order.prototype.getStores = function () {
        var stores = this.getUnique(this.items.map(function (x) { return x.store; }));
        return stores;
    };
    Order.prototype.getUnique = function (data) {
        var unique = {};
        var distinct = [];
        data.forEach(function (x) {
            if (!unique[x._id.$oid]) {
                distinct.push(x);
                unique[x._id.$oid] = true;
            }
        });
        return distinct;
    };
    Order.prototype.getItems = function (store_id) {
        if (store_id === void 0) { store_id = null; }
        if (store_id == null) {
            return this.items;
        }
        return this.items.filter(function (x) { return _.isEqual(x.store_id, store_id); });
    };
    Order.prototype.getDeliveryCharges = function () {
        return this.delivery_charges;
    };
    Order.prototype.getTotalAmount = function () {
        return this.getDeliveryCharges() + this.getSubTotal();
    };
    Order.prototype.getSubTotal = function () {
        return this.items.reduce(function (n, x) { return n + x.getTotalPrice(); }, 0);
    };
    Order.prototype.getTotalQuantity = function () {
        return this.items.reduce(function (n, x) { return n + x.quantity; }, 0);
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
        this.store = restaurant_1.Restaurant.of(this.store);
    }
    LineItem.prototype.getTotalPrice = function () {
        return this.price * this.quantity;
    };
    LineItem.of = function (data) {
        if (data == null || data.constructor.name == LineItem.name) {
            return data;
        }
        return new LineItem(data);
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
    DeliveryDetails.of = function (data) {
        if (data == null || data.constructor.name == DeliveryDetails.name) {
            return data;
        }
        return new DeliveryDetails(data);
    };
    return DeliveryDetails;
}());
exports.DeliveryDetails = DeliveryDetails;
//# sourceMappingURL=order.js.map