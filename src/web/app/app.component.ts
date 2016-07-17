import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { POPOVER_DIRECTIVES } from "ng2-popover";

import { CartSummaryComponent } from './components/cartsummary';
import { CheckoutComponent } from './components/checkout';
import { HomeComponent } from './components/home';
import { OrderSuccessComponent } from './components/order_success';
import { OtpComponent } from './components/otp';
import { RestaurantComponent } from './restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail.component';
import { TrackOrderComponent } from './components/track_order';

import { FaqComponent } from './components/faq';
import { TermsOfUseComponent } from './components/terms';
import { ContactUsComponent } from './components/contactus';
import { AboutUsComponent } from './components/aboutus';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: 'templates/app.html',
  directives: [ROUTER_DIRECTIVES, POPOVER_DIRECTIVES, RestaurantComponent, CartSummaryComponent],
  providers: [ROUTER_PROVIDERS, StoreService, ProductService, OrderService]
})
@RouteConfig([
  { name: 'Home', path: '/', component: HomeComponent, useAsDefault: true},
  { name: 'RestaurantList', path: 'restaurants', component: RestaurantComponent},
  { name: 'RestaurantDetail', path: 'restaurant/:id', component: RestaurantDetailComponent },
  { name: 'Checkout', path: 'checkout', component: CheckoutComponent },
  { name: 'Otp', path: 'verify_otp', component: OtpComponent },
  { name: 'OrderConfirmed', path: 'order_success', component: OrderSuccessComponent },
  { name: 'TrackOrder', path: 'track/:order_no', component: TrackOrderComponent },

  { name: 'Faq', path: 'faq', component: FaqComponent },
  { name: 'TermsOfUse', path: 'terms_of_use', component: TermsOfUseComponent },
  { name: 'ContactUs', path: 'contact_us', component: ContactUsComponent },
  { name: 'AboutUs', path: 'about_us', component: AboutUsComponent },
])
export class AppComponent {
  constructor(private router: Router){}
}
