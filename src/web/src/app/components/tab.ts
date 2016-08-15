import { Component } from '@angular/core';

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
  active: boolean = false;
}
