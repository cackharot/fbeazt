import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { ViewChild, ElementRef, Renderer } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { LocalStorage, SessionStorage } from "../libs/WebStorage";

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from '../spinner/spinner.component';

import { Product, Category } from '../model/product';
import { Order, DeliveryDetails, LineItem } from '../model/order';

import { AppConfig } from '../AppConfig';

@Component({
  selector: 'checkout',
  templateUrl: './checkout.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class CheckoutComponent implements OnInit {
  @ViewChild('payubutton') onlinePaymentForm: ElementRef;
  @ViewChild('ordernotxt') orderNoTxt: ElementRef;
  payment_url: string = AppConfig.ONLINE_PAYMENT_POST_URL;
  order: Order;
  orderSuccess: boolean = false;
  isRequesting: boolean = false;
  @LocalStorage() canSaveDeliveryDetails: boolean = false;
  @SessionStorage() availablePincodes: any[] = [];
  error: any = null;

  constructor(private router: Router,
    private renderer: Renderer,
    private orderService: OrderService) {
    this.router.events.subscribe(x => {
      window.scroll(0, 0);
    });
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    this.orderSuccess = this.order.isConfirmed();
    this.restoreDeliveryDetails();
    if (!this.onlinePaymentEnabled()) {
      this.order.payment_type = 'cod';
    }
    // this.fetchAvailablePincodes();
  }

  ngAfterViewInit() {
    if (this.order.order_no && this.order.order_no.length != 0) {
      this.navOrder();
    }
  }

  private fetchAvailablePincodes() {
    if (this.availablePincodes.length > 0) {
      return;
    }
    this.orderService.fetchAvailablePincodes()
      .then(x => {
        this.availablePincodes = x;
      }).catch(e => { console.log(e); });
  }

  resetOrder() {
    this.orderService.resetOrder();
    this.router.navigate(['home']);
  }

  navOrder() {
    if (this.order.payment_type === 'payumoney' && !this.order.isPaymentValid()) {
      this.orderNoTxt.nativeElement.value = this.order.order_no;
      this.renderer.invokeElementMethod(
        this.onlinePaymentForm.nativeElement,
        'dispatchEvent',
        [new MouseEvent('click', { bubbles: true })]
      );
      return;
    }
    if (this.order.isOtpSent() && this.order.isValid()) {
      this.router.navigate(['/otp']);
    } else if (this.order.isConfirmed()) {
      this.router.navigate(['/order_success']);
    }
  }

  confirmOrder() {
    this.saveDeliveryDetails();
    if (this.order.items.length > 0) {
      this.isRequesting = true;
      this.orderService.confirmOrder()
        .then(updatedOrder => {
          this.order = updatedOrder;
          this.orderSuccess = true;
          this.error = null;
          this.navOrder();
          this.isRequesting = false;
        }, errorMsg => {
          this.orderSuccess = false;
          this.error = errorMsg;
          this.isRequesting = false;
        });
    } else {
      this.error = "Invalid order";
    }
  }

  removeItem(item: LineItem) {
    this.orderService.removeItem(item);
  }

  changeQuantity(item: LineItem, value: number) {
    this.orderService.updateQuantity(item, value);
  }

  private saveDeliveryDetails() {
    if (this.canSaveDeliveryDetails == false) {
      localStorage.setItem("delivery_details", null);
      return;
    }
    try {
      let value = JSON.stringify(this.order.delivery_details);
      localStorage.setItem("delivery_details", value);
    } catch (e) {
      console.log(e);
    }
  }

  private restoreDeliveryDetails() {
    if (this.canSaveDeliveryDetails == false) {
      return;
    }
    try {
      let value = JSON.parse(localStorage.getItem("delivery_details"));
      if (value && value.name) {
        this.order.delivery_details = DeliveryDetails.of(value);
      }
    } catch (e) {
      console.log(e);
    }
  }

  isEmpty() {
    return this.order && this.order.items.length == 0;
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  onlinePaymentEnabled() {
    return AppConfig.ENABLE_PAYUMONEY;
  }
}
