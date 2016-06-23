"use strict";
var platform_browser_dynamic_1 = require('@angular/platform-browser-dynamic');
var http_1 = require('@angular/http');
var router_deprecated_1 = require('@angular/router-deprecated');
var LocalStorageEmitter_1 = require('angular2-localstorage/LocalStorageEmitter');
var app_component_1 = require('./app.component');
var appPromise = platform_browser_dynamic_1.bootstrap(app_component_1.AppComponent, [
    http_1.HTTP_PROVIDERS,
    router_deprecated_1.ROUTER_PROVIDERS,
    LocalStorageEmitter_1.LocalStorageService
]);
LocalStorageEmitter_1.LocalStorageSubscriber(appPromise);
//# sourceMappingURL=main.js.map