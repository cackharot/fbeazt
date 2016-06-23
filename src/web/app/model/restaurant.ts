import { ObjectId, Date } from "./base";

export class Restaurant {
  _id: ObjectId = new ObjectId();
  cuisines: string[];
  deliver_time: number;
  phone: string;
  open_time: number;
  close_time: number;
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
}
