import { Component, OnInit } from '@angular/core';
import { RouteParams, ROUTER_DIRECTIVES } from '@angular/router-deprecated';
import { LocalStorage, SessionStorage } from "angular2-localstorage/WebStorage";

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from './spinner';

import { DateTimePipe } from '../pipes/datetime.pipe';

import { Product, Category } from '../model/product';
import { Order, OrderStatus, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'track-order',
  templateUrl: 'templates/track_order.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
  pipes: [DateTimePipe],
})
export class TrackOrderComponent implements OnInit {
  @SessionStorage() orderNo:string='';
  order: Order;
  isRequesting:boolean = false;
  submitted:boolean = false;
  errorMsg:string;

  constructor(private orderService:OrderService,
    private routeParams: RouteParams){

  }

  ngOnInit(){
    this.orderNo = this.routeParams.get('order_no') || '';
    this.searchOrder();
  }

  searchOrder(){
    if(this.orderNo.length == 0){
      this.order = null;
      return;
    }

    this.isRequesting=true;
    this.submitted=true;
    this.orderService.loadOrder(this.orderNo)
      .then(x=>{
        this.order = x;
        this.isRequesting=false;
      })
      .catch(errorMsg=>{
        this.errorMsg=errorMsg
        this.isRequesting=false;
      });
  }
}
