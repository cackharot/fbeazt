import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';
import {LocalStorage, SessionStorage} from "angular2-localstorage/WebStorage";

import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'otp',
  templateUrl: 'templates/otp.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class OtpComponent implements OnInit {
  static OTP_RESEND_SECONDS:number = 120;
  order: Order;
  isRequesting:boolean = false;
  @SessionStorage() seconds:number=OtpComponent.OTP_RESEND_SECONDS;
  error:any = null;
  otp:string = '';
  new_number:string = '';

  constructor(private router: Router,
    private orderService: OrderService) {
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    if(this.order.isConfirmed()){
      this.router.navigate(['OrderConfirmed']);
    }else{
      this.decSeconds();
    }
  }

  private decSeconds(){
    this.seconds--;
    if(this.seconds > 0){
      var that = this;
      window.setTimeout(function() {
        that.decSeconds();
      }, 1000);
    }
  }

  resetOrder(){
    this.seconds = OtpComponent.OTP_RESEND_SECONDS;
    this.orderService.cancelOrder();
    this.router.navigate(['Home']);
  }

  verifyOtp(){
    this.seconds = OtpComponent.OTP_RESEND_SECONDS;
    this.isRequesting = true;
    this.orderService.verifyOtp(this.otp, this.new_number)
      .then(data => {
        this.error = null;
        this.isRequesting = false;
        if(data.status == "success"){
          this.order.otp_status = 'VERIFIED';
          this.router.navigate(['OrderConfirmed']);
        }else{
          this.error = data.message;
        }
      }, errorMsg => {
        this.error = errorMsg
        this.isRequesting = false;
      });
  }

  resendOtp(){
    this.isRequesting = true;
    this.orderService.resendOtp(this.new_number)
      .then(data => {
        this.error = null;
        this.isRequesting = false;
        if(data.status == "success"){
        }else{
          this.error = data.message;
        }
        this.seconds = OtpComponent.OTP_RESEND_SECONDS*2;
        this.decSeconds();
      }, errorMsg => {
        this.error = errorMsg
        this.isRequesting = false;
        this.seconds = OtpComponent.OTP_RESEND_SECONDS;
        this.decSeconds();
      });
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  canResendOTP(){
    return this.seconds == 0;
  }
}
