"use strict";
var base_1 = require("./base");
var Restaurant = (function () {
    function Restaurant(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.holidays = [];
        this.tenant_id = new base_1.ObjectId();
        Object.assign(this, data);
        this._id = base_1.ObjectId.of(this._id);
    }
    Restaurant.prototype.getId = function () {
        return this._id.$oid;
    };
    Restaurant.prototype.getTenantId = function () {
        return this.tenant_id.$oid;
    };
    Restaurant.prototype.getCreatedAt = function () {
        return this.created_at.$date;
    };
    Restaurant.of = function (data) {
        if (data == null || data.constructor.name == 'Restaurant') {
            return data;
        }
        return new Restaurant(data);
    };
    return Restaurant;
}());
exports.Restaurant = Restaurant;
//# sourceMappingURL=restaurant.js.map