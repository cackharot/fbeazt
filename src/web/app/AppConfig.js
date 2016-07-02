"use strict";
var AppConfig = (function () {
    function AppConfig() {
    }
    AppConfig.BASE_URL = "http://localhost:4000/api";
    AppConfig.STORES_URL = AppConfig.BASE_URL + "/stores";
    AppConfig.STORE_URL = AppConfig.BASE_URL + "/store";
    AppConfig.PRODUCTS_URL = AppConfig.BASE_URL + "/products";
    AppConfig.PRODUCT_URL = AppConfig.BASE_URL + "/product";
    AppConfig.ORDER_URL = AppConfig.BASE_URL + "/order";
    return AppConfig;
}());
exports.AppConfig = AppConfig;
//# sourceMappingURL=AppConfig.js.map