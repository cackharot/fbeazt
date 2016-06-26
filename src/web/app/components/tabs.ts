import {Component, ViewChild, ContentChild,
  ContentChildren, QueryList, Query, Directive, forwardRef,
  AfterViewInit, AfterContentInit} from '@angular/core';

import { Tab } from './tab';

@Component({
  selector: 'tabs',
  template: `
    <ul class="tabs" role="tablist">
      <li class="tabs-title" *ngFor="let tab of tabs" [class.active]="tab.active">
        <a (click)="selectTab(tab, $event)">{{tab.title}}</a>
      </li>
    </ul>
    <div class="tabs-content">
      <ng-content></ng-content>
    </div>
  `,
})
export class Tabs implements AfterContentInit {
  @ContentChildren(forwardRef(() => Tab)) tabs: QueryList<Tab>;

  // contentChildren are set
  ngAfterContentInit() {
    var that = this;
    this.tabs.changes.subscribe(x=>{
      window.setTimeout(function(){
        if(that.tabs.length>0){
          that.initTabs();
        }
      }, 200);
    });
  }

  initTabs(){
    // get all active tabs
    let activeTabs = this.tabs.filter((tab)=>tab.active);

    // if there is no active tab set, activate the first
    if(activeTabs.length === 0) {
      this.selectTab(this.tabs.first, null);
    }
  }

  selectTab(tab: Tab, event: any) {
    if(event){
      event.preventDefault();
    }
    if(tab === undefined || tab.active === true){
      return;
    }
    this.tabs.toArray().forEach((x) => {
      x.active = false;
    });
    tab.active = true;
  }
}
