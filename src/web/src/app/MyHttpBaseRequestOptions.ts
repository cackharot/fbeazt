import { Http, Headers, BaseRequestOptions, URLSearchParams } from '@angular/http';

import { OAuthService } from 'angular2-oauth2/oauth-service';

export class MyHttpBaseRequestOptions extends BaseRequestOptions {
  constructor(private authService: OAuthService) {
    super();
    if (this.authService && this.authService.getIdToken()) {
      console.log(this.authService.authorizationHeader());
      this.headers.append('Authorization', this.authService.authorizationHeader());
    }
  }
}
