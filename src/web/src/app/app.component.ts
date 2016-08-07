import { Component, NgZone } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { Http, URLSearchParams } from '@angular/http';

import { CartSummaryComponent } from './cartsummary/cartsummary.component';
import { RestaurantComponent } from './restaurant/restaurant.component';

import { SpinnerComponent } from './spinner/spinner.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

import { OAuthService } from 'angular2-oauth2/oauth-service';

@Component({
  selector: 'fb-app',
  templateUrl: './app.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent, CartSummaryComponent, RestaurantComponent],
  providers: [StoreService, ProductService, OrderService]
})
export class AppComponent {

  constructor(private oauthService: OAuthService,
              private router: Router,
              private http: Http) {
    this.oauthService.loginUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    this.oauthService.redirectUri = window.location.origin;
    this.oauthService.clientId = '280436316587-pc2v79112kdqu0jiruu56m92s8nr4s42.apps.googleusercontent.com';
    this.oauthService.scope = 'openid profile email';
    this.oauthService.oidc = true;
    this.oauthService.setStorage(sessionStorage);
    this.oauthService.logoutUrl = null;

    this.oauthService.tryLogin({
      onTokenReceived: context => {
        if(window.location.hash && window.location.hash.indexOf('access_token') !== -1){
          this.router.navigate(['home']);
        }
      },
      validationHandler: context => {
        var search = new URLSearchParams();
        search.set('access_token', context.accessToken);
        let v = http.get('https://www.googleapis.com/oauth2/v3/tokeninfo', { search })
          .toPromise().then(x => {
            if (x.json().aud !== oauthService.clientId) {
              console.error('Wrong client_id');
              oauthService.logOut();
            }
          });
        return v;
      }
    });
  }

  public login() {
    this.oauthService.initImplicitFlow();
  }

  public logoff() {
    this.oauthService.logOut();
    this.router.navigate(['/home']);
  }

  public get name() {
    let claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims.given_name;
  }

  public get avatar(){
    let claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims.picture;
  }
}
