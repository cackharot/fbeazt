import {RouterConfig, provideRouter} from '@angular/router';

import {CheckoutComponent} from './checkout/checkout.component';
import {HomeComponent} from './home/home.component';
import {OrderSuccessComponent} from './order-success/order-success.component';
import {OrderFailureComponent} from './order-failure/order-failure.component';
import {OtpComponent} from './otp/otp.component';
import {RestaurantComponent} from './restaurant/restaurant.component';
import {RestaurantDetailComponent} from './restaurant-detail/restaurant-detail.component';
import {TrackOrderComponent} from './track-order/track-order.component';
import {MyOrderComponent} from './my-order/my-order.component';
import {FaqComponent} from './faq/faq.component';
import {TermsOfUseComponent} from './terms/terms.component';
import {ContactUsComponent} from './contactus/contactus.component';
import {AboutUsComponent} from './aboutus/aboutus.component';

const routes: RouterConfig = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'restaurants', component: RestaurantComponent},
  { path: 'restaurant/:id', component: RestaurantDetailComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'otp', component: OtpComponent },
  { path: 'order_success', component: OrderSuccessComponent },
  { path: 'order_failure', component: OrderFailureComponent },
  { path: 'track', component: TrackOrderComponent },
  { path: 'track/:order_no', component: TrackOrderComponent },
  { path: 'my_orders', component: MyOrderComponent },

  { path: 'faq', component: FaqComponent },
  { path: 'terms_of_use', component: TermsOfUseComponent },
  { path: 'contact_us', component: ContactUsComponent },
  { path: 'about_us', component: AboutUsComponent }
  // { path: '**', component: PageNotFoundComponent }
];

export const appRouterProviders = [
  provideRouter(routes)
];
