"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var core_2 = require('@angular/core');
var Tab = (function () {
    function Tab() {
        this.active = false;
    }
    Tab = __decorate([
        core_1.Component({
            selector: 'tab',
            inputs: [
                'title:tabTitle',
                'active'
            ],
            template: "\n    <div class=\"content\" [hidden]=\"!active\">\n      <ng-content></ng-content>\n    </div>\n  "
        }), 
        __metadata('design:paramtypes', [])
    ], Tab);
    return Tab;
}());
exports.Tab = Tab;
var Tabs = (function () {
    function Tabs() {
    }
    // contentChildren are set
    Tabs.prototype.ngAfterContentInit = function () {
        this.initTabs();
    };
    Tabs.prototype.initTabs = function () {
        // get all active tabs
        var activeTabs = this.tabs.filter(function (tab) { return tab.active; });
        // if there is no active tab set, activate the first
        if (activeTabs.length === 0) {
            this.selectTab(this.tabs.first, null);
        }
    };
    Tabs.prototype.selectTab = function (tab, event) {
        if (event) {
            event.preventDefault();
        }
        console.log(tab);
        if (tab === undefined) {
            return;
        }
        this.tabs.toArray().forEach(function (x) {
            x.active = false;
        });
        tab.active = true;
    };
    __decorate([
        core_2.ContentChildren(Tab), 
        __metadata('design:type', core_2.QueryList)
    ], Tabs.prototype, "tabs", void 0);
    Tabs = __decorate([
        core_1.Component({
            selector: 'tabs',
            template: "\n    <ul class=\"tabs\" role=\"tablist\">\n      <li class=\"tabs-title\" *ngFor=\"let tab of tabs\" [class.active]=\"tab.active\">\n        <a href=\"#\" (click)=\"selectTab(tab, $event)\">{{tab.title}}</a>\n      </li>\n    </ul>\n    <div class=\"tabs-content\">\n      <ng-content></ng-content>\n    </div>\n  ",
        }), 
        __metadata('design:paramtypes', [])
    ], Tabs);
    return Tabs;
}());
exports.Tabs = Tabs;
//# sourceMappingURL=tabs.js.map