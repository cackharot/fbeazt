"use strict";
var Restaurant = (function () {
    function Restaurant() {
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
    return Restaurant;
}());
exports.Restaurant = Restaurant;
//# sourceMappingURL=restaurant.js.map