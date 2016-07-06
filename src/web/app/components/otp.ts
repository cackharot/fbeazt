import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';

import { Order, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'otp',
  templateUrl: 'templates/otp.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
})
export class OtpComponent implements OnInit {
  order: Order;
  isRequesting:boolean = false;
  error:any = null;
  otp:string = '';
  new_number:string = '';

  constructor(private router: Router,
    private orderService: OrderService) {
  }

  ngOnInit() {
    this.order = this.orderService.getOrder();
    console.log(this.order);
    if(this.order.isConfirmed()){
      this.router.navigate(['OrderConfirmed']);
    }
  }

  resetOrder(){
    this.orderService.cancelOrder();
    this.router.navigate(['Home']);
  }

  verifyOtp(){
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

  goBack(id: string) {
    this.router.navigate([id]);
  }
}
