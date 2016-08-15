import { Component } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

@Component({
  selector: 'termsofuse',
  templateUrl: './terms.component.html',
  directives: [ROUTER_DIRECTIVES]
})
export class TermsOfUseComponent {
  constructor(private router: Router) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }
}
