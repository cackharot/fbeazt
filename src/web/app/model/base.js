"use strict";
var ObjectId = (function () {
    function ObjectId(data) {
        if (data === void 0) { data = {}; }
        Object.assign(this, data);
    }
    ObjectId.of = function (data) {
        if (data && data.constructor.name != ObjectId.name) {
            if (data.$oid == undefined) {
                return new ObjectId();
            }
            return new ObjectId({ "$oid": data.$oid });
        }
        return data;
    };
    return ObjectId;
}());
exports.ObjectId = ObjectId;
var Date = (function () {
    function Date(data) {
        if (data === void 0) { data = {}; }
        Object.assign(this, data);
    }
    return Date;
}());
exports.Date = Date;
//# sourceMappingURL=base.js.map