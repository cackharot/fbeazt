import { Component } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

@Component({
  selector: 'contact-us',
  templateUrl: './contactus.component.html',
  directives: [ROUTER_DIRECTIVES]
})
export class ContactUsComponent {
  constructor(private router: Router) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }
}
