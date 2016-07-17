import { Component } from '@angular/core';
import { Router, RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { POPOVER_DIRECTIVES } from "ng2-popover";

import { CartSummaryComponent } from './cartsummary/cartsummary.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { HomeComponent } from './home/home.component';
import { OrderSuccessComponent } from './order-success/order-success.component';
import { OtpComponent } from './otp/otp.component';
import { RestaurantComponent } from './restaurant/restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';
import { TrackOrderComponent } from './track-order/track-order.component';

import { SpinnerComponent } from './spinner/spinner.component';

import { FaqComponent } from './faq/faq.component';
import { TermsOfUseComponent } from './terms/terms.component';
import { ContactUsComponent } from './contactus/contactus.component';
import { AboutUsComponent } from './aboutus/aboutus.component';

import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'fb-app',
  templateUrl: './app.component.html',
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
