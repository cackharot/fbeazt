"use strict";
var Order = (function () {
    function Order(data) {
        if (data === void 0) { data = {}; }
        this.delivery_details = new DeliveryDetails();
        Object.assign(this, data);
        if (this.items == undefined) {
            this.items = [];
            this.status = false;
            this.state = 'NEW';
        }
        if (this.items.length > 0 && this.items[0].constructor.name != 'LineItem') {
            this.items = this.items.map(function (x) { return new LineItem(x); });
        }
        if (this.delivery_details.constructor.name != 'DeliveryDetails') {
            this.delivery_details = new DeliveryDetails(this.delivery_details);
        }
    }
    Order.prototype.confirm = function () {
        this.status = true;
        this.state = 'CONFIRMED';
    };
    Order.prototype.addItem = function (item) {
        var cur_item = this.items.find(function (x) { return x.product_id == item.product_id; });
        if (cur_item == undefined) {
            this.items.push(item);
        }
        else {
            cur_item.quantity++;
        }
    };
    Order.prototype.getTotalAmount = function () {
        var price = 0;
        this.items.forEach(function (x) { return price = price + x.price; });
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
        Object.assign(this, data);
    }
    return LineItem;
}());
exports.LineItem = LineItem;
var DeliveryDetails = (function () {
    function DeliveryDetails(data) {
        if (data === void 0) { data = {}; }
        Object.assign(this, data);
    }
    return DeliveryDetails;
}());
exports.DeliveryDetails = DeliveryDetails;
//# sourceMappingURL=order.js.map