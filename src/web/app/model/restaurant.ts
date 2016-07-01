import { ObjectId, Date } from "./base";
import * as moment from "moment";

export class Restaurant {
  _id: ObjectId = new ObjectId();
  cuisines: string[];
  deliver_time: number;
  phone: string;
  open_time: number;
  close_time: number;
  holidays:string[] = ['Friday'];
  is_closed:boolean = false;
  tenant_id: ObjectId = new ObjectId();
  created_at: Date;
  food_type: string[];
  address: string;
  name: string;
  status: boolean;

  constructor(data={}){
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
  }

  getId(){
    return this._id.$oid;
  }

  getTenantId(){
    return this.tenant_id.$oid;
  }

  getCreatedAt(){
    return this.created_at.$date;
  }

  isOpen(){
    let hr = moment().hour();
    let min = moment().minute();
    return !this.is_closed && (hr >= this.open_time && hr <= (this.close_time+12));
  }

  isClosed(){
    return !this.isOpen();
  }

  isHoliday(){
    let hs = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    let weekday = hs[moment().weekday()-1];
    return this.holidays.some(x=> x.toLocaleLowerCase().localeCompare(weekday) == 0);
  }

  static of(data){
    if(data == null || data.constructor.name == 'Restaurant'){
      return data;
    }
    return new Restaurant(data);
  }
}
