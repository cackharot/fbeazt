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
var tab_1 = require('./tab');
var Tabs = (function () {
    function Tabs() {
    }
    Tabs.prototype.ngOnInit = function () {
    };
    // contentChildren are set
    Tabs.prototype.ngAfterContentInit = function () {
        var that = this;
        this.tabs.changes.subscribe(function (x) {
            window.setTimeout(function () {
                if (that.tabs.length > 0) {
                    that.initTabs();
                }
            }, 200);
        });
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
        if (tab === undefined || tab.active === true) {
            return;
        }
        this.tabs.toArray().forEach(function (x) {
            x.active = false;
        });
        tab.active = true;
    };
    __decorate([
        core_1.ContentChildren(core_1.forwardRef(function () { return tab_1.Tab; })), 
        __metadata('design:type', core_1.QueryList)
    ], Tabs.prototype, "tabs", void 0);
    Tabs = __decorate([
        core_1.Component({
            selector: 'tabs',
            template: "\n    <ul class=\"tabs\" role=\"tablist\">\n      <li class=\"tabs-title\" *ngFor=\"let tab of tabs\" [class.active]=\"tab.active\">\n        <a (click)=\"selectTab(tab, $event)\">{{tab.title}}</a>\n      </li>\n    </ul>\n    <div class=\"tabs-content\">\n      <ng-content></ng-content>\n    </div>\n  ",
        }), 
        __metadata('design:paramtypes', [])
    ], Tabs);
    return Tabs;
}());
exports.Tabs = Tabs;
//# sourceMappingURL=tabs.js.map