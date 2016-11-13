import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

import { StoreService } from '../services/store.service';

import { Restaurant } from '../model/restaurant';

import { ChunkPipe } from '../pipes/chunk.pipe';

@Component({
  selector: 'popular-stores',
  templateUrl: './popular-stores.component.html',
  directives: [ROUTER_DIRECTIVES]
})
export class PopularStoresComponent {
  @Input() stores: Restaurant[];
  errorMsg: string;

  constructor(protected router: Router, protected storeService: StoreService) { }

  ngOnInit(){
      this.loadPopularStores();
  }

  loadPopularStores() {
      this.storeService.getPopularStores()
      .then(x=>{
          this.stores = x;
      })
      .catch(e=>{
          this.errorMsg = e;
      });
  }

  navigate(store_id) {
      this.router.navigate(['/restaurant', store_id]);
      return false;
  }
}

