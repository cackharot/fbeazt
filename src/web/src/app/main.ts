import { bootstrap }    from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } from '@angular/http';
import { disableDeprecatedForms, provideForms } from '@angular/forms';
import { LocalStorageService, LocalStorageSubscriber } from './libs/LocalStorageEmitter';

import { AppComponent } from './app.component';
import { appRouterProviders } from './app.routes';

let appPromise = bootstrap(AppComponent,[
  appRouterProviders,
  disableDeprecatedForms(),
  provideForms(),
  HTTP_PROVIDERS,
  LocalStorageService,
])
.catch((err: any) => console.error(err));

LocalStorageSubscriber(appPromise);
