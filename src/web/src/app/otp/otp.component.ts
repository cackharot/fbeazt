import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from '../spinner/spinner.component';

import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'otp',
  templateUrl: './otp.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class OtpComponent implements OnInit {
  static OTP_RESEND_SECONDS:number = 120;
  static MAX_OTP_RESEND:number = 2;
  static KEY:string = "__otp__seconds";
  static INTERVAL:number = 1000;
  order: Order;
  isRequesting:boolean = false;
  seconds:number=OtpComponent.OTP_RESEND_SECONDS;
  error:any = null;
  otp:string = '';
  new_number:string = '';
  storage:Storage;
  timeoutHandle:number;
  isMaxOtpAttempt:boolean=false;

  constructor(private router: Router, private orderService: OrderService) {
    this.storage = window.sessionStorage;
    this.router.events.subscribe(x=>{
      window.scroll(0,0);
    });
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    this.seconds = +this.storage.getItem(OtpComponent.KEY);
    if(this.seconds <= 0 && this.getResendOtpCount() == 0){
     this.seconds = OtpComponent.OTP_RESEND_SECONDS;
    }
    if(this.order.isConfirmed()){
      this.router.navigate(['order_success']);
    }else if(!this.order.isValid()){
      this.router.navigate(['checkout']);
    }else{
      this.startCountDown();
    }
  }

  private startCountDown(){
    if(this.seconds > 0){
      this.seconds--;
      this.storage.setItem(OtpComponent.KEY, this.seconds.toString());
      this.isMaxOtpAttempt = this.hasReachedMaxOtp();
      var that = this;
      this.timeoutHandle = window.setTimeout(function() {
        that.startCountDown();
      }, OtpComponent.INTERVAL);
    }
  }

  cancelOrder(){
    this.resetTimeout();
    this.resetOtpCount();
    this.order.otp_status = null;
    this.router.navigate(['checkout']);
    return false;
  }

  resetTimeout(){
    window.clearTimeout(this.timeoutHandle);
    this.seconds = OtpComponent.OTP_RESEND_SECONDS;
  }

  verifyOtp(){
    this.resetTimeout();
    this.isRequesting = true;
    this.orderService.verifyOtp(this.otp, this.new_number)
      .then(data => {
        this.error = null;
        this.isRequesting = false;
        if(data.status == "success"){
          this.order.otp_status = 'VERIFIED';
          this.router.navigate(['order_success']);
        }else{
          this.error = data.message;
          this.startCountDown();
        }
      }, errorMsg => {
        this.error = errorMsg
        this.isRequesting = false;
        this.startCountDown();
      });
  }

  updateOtpCount(){
    let key = "__resend__otp__" + this.order.getHash();
    let count = +this.storage.getItem(key) || 0;
    count++;
    this.storage.setItem(key, count.toString());
  }

  private resetOtpCount(){
    let key = "__resend__otp__" + this.order.getHash();
    this.storage.setItem(key, null);
  }

  getResendOtpCount(){
    let key = "__resend__otp__" + this.order.getHash();
    let count = +this.storage.getItem(key) || 0;
    return count;
  }

  hasReachedMaxOtp(){
    return this.getResendOtpCount() > OtpComponent.MAX_OTP_RESEND;
  }

  resendOtp(){
    if(this.hasReachedMaxOtp() && this.canResendOTP()){
      console.error("Attempt to resend OTP after reaching max attempt or before current timeout expires!");
      return;
    }
    this.updateOtpCount();
    this.isRequesting = true;
    this.orderService.resendOtp(this.new_number)
      .then(data => {
        this.error = null;
        this.isRequesting = false;
        if(data.status == "success"){
        }else{
          this.error = data.message;
        }
        this.resetTimeout();
        this.startCountDown();
      }, errorMsg => {
        this.error = errorMsg
        this.isRequesting = false;
        this.resetTimeout();
        this.startCountDown();
      });
  }

  goBack(id: string) {
    this.router.navigate([id]);
  }

  canResendOTP(){
    return this.seconds == 0;
  }
}
