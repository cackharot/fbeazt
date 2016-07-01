"use strict";
var base_1 = require("./base");
var moment = require("moment");
var Restaurant = (function () {
    function Restaurant(data) {
        if (data === void 0) { data = {}; }
        this._id = new base_1.ObjectId();
        this.holidays = ['Friday'];
        this.is_closed = false;
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
    Restaurant.prototype.isOpen = function () {
        var hr = moment().hour();
        var min = moment().minute();
        return !this.is_closed && (hr >= this.open_time && hr <= (this.close_time + 12));
    };
    Restaurant.prototype.isClosed = function () {
        return !this.isOpen();
    };
    Restaurant.prototype.isHoliday = function () {
        var hs = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        var weekday = hs[moment().weekday() - 1];
        return this.holidays.some(function (x) { return x.toLocaleLowerCase().localeCompare(weekday) == 0; });
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