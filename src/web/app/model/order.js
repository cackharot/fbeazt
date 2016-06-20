"use strict";
var Order = (function () {
    function Order() {
        this.items = [];
        this.status = false;
        this.state = 'NEW';
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
    return Order;
}());
exports.Order = Order;
var LineItem = (function () {
    function LineItem(product_id, name, desc, category, food_type, quantity, price) {
        this.product_id = product_id;
        this.name = name;
        this.description = desc;
        this.category = category;
        this.vegetarian = food_type === 'veg';
        this.quantity = quantity;
        this.price = price;
    }
    return LineItem;
}());
exports.LineItem = LineItem;
var DeliveryDetails = (function () {
    function DeliveryDetails() {
    }
    return DeliveryDetails;
}());
exports.DeliveryDetails = DeliveryDetails;
//# sourceMappingURL=order.js.map