import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { ContentChildren, QueryList, AfterContentInit } from '@angular/core';

@Component({
  selector: 'tab',
  inputs: [
  'title:tabTitle',
  'active'
  ],
  template: `
    <div class="content" [hidden]="!active">
      <ng-content></ng-content>
    </div>
  `
})
export class Tab {
  title: string;
  active: boolean;

  constructor(){
    this.active = false;
  }
}

@Component({
  selector: 'tabs',
  template: `
    <ul class="tabs" role="tablist">
      <li class="tabs-title" *ngFor="let tab of tabs" [class.active]="tab.active">
        <a href="#" (click)="selectTab(tab, $event)">{{tab.title}}</a>
      </li>
    </ul>
    <div class="tabs-content">
      <ng-content></ng-content>
    </div>
  `,
})
export class Tabs implements AfterContentInit {
  @ContentChildren(Tab) tabs: QueryList<Tab>;

  // contentChildren are set
  ngAfterContentInit() {
    this.initTabs();
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
    console.log(tab);
    if(tab === undefined){
      return;
    }
    this.tabs.toArray().forEach((x) => {
      x.active = false;
    });
    tab.active = true;
  }
}
