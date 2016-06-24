import { bootstrap }    from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } from '@angular/http';
import { ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import {LocalStorageService, LocalStorageSubscriber} from 'angular2-localstorage/LocalStorageEmitter';

import { AppComponent } from './app.component';

let appPromise = bootstrap(AppComponent,[
  HTTP_PROVIDERS,
  ROUTER_PROVIDERS,
  LocalStorageService,
])
.catch((err: any) => console.error(err));

LocalStorageSubscriber(appPromise);
