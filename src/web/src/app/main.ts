import { provide } from '@angular/core';
import { bootstrap }    from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS, RequestOptions } from '@angular/http';
import { disableDeprecatedForms, provideForms } from '@angular/forms';
import { LocalStorageService, LocalStorageSubscriber } from './libs/LocalStorageEmitter';

import { AppComponent } from './app.component';
import { appRouterProviders } from './app.routes';
import { FeatureService } from './feature';
import { MyHttpBaseRequestOptions } from './MyHttpBaseRequestOptions';

import { OAuthService } from 'angular2-oauth2/oauth-service';
import { enableProdMode } from '@angular/core';


// Enable production mode unless running locally
if (!/localhost/.test(document.location.host)) {
  enableProdMode();
}

let appPromise = bootstrap(AppComponent,[
  appRouterProviders,
  disableDeprecatedForms(),
  provideForms(),
  HTTP_PROVIDERS,
  LocalStorageService,
  OAuthService,
  provide(FeatureService, { useClass: FeatureService })
  // provide(RequestOptions, { useClass: MyHttpBaseRequestOptions })
])
.catch((err: any) => console.error(err));

LocalStorageSubscriber(appPromise);
