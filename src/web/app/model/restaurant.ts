export interface Id {
  $oid: string;
}

export interface TenantId {
  $oid: string;
}

export interface Date {
  $date: number;
}

export class Restaurant {
  _id: Id;
  cuisine: string;
  deliver_time: number;
  phone: string;
  open_time: number;
  close_time: number;
  tenant_id: TenantId;
  created_at: Date;
  food_type: string[];
  address: string;
  name: string;
  status: boolean;

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
