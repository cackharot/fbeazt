import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES } from '@angular/router';
import { LocalStorage, SessionStorage } from "../libs/WebStorage";

import { OrderService } from '../services/order.service';
import { SpinnerComponent } from '../spinner/spinner.component';

import { DateTimePipe } from '../pipes/datetime.pipe';

import { Product, Category } from '../model/product';
import { Order, OrderStatus, DeliveryDetails, LineItem } from '../model/order';

@Component({
  selector: 'track-order',
  templateUrl: './track-order.component.html',
  directives: [ROUTER_DIRECTIVES, SpinnerComponent],
  pipes: [DateTimePipe],
})
export class TrackOrderComponent implements OnInit, OnDestroy {
  @SessionStorage() orderNo:string='';
  order: Order;
  isRequesting:boolean = false;
  submitted:boolean = false;
  errorMsg:string;
  private sub: any;

  constructor(private orderService:OrderService,
              private router: Router,
              private route: ActivatedRoute){
    this.router.events.subscribe(x=>{
      window.scroll(0,0);
    });
  }

  ngOnInit(){
    this.sub = this.route.params.subscribe(params => {
        this.orderNo = (params['order_no'] || '').trim();
        this.searchOrder();
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
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
