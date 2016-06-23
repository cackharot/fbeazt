import { ObjectId, Date } from "./base";

export class Product {
  _id: ObjectId = new ObjectId();
  deliver_time: number;
  cuisines: string[];
  buy_price: number;
  open_time: number;
  store_id: ObjectId = new ObjectId();
  discount: number;
  close_time: number;
  category: string;
  created_at: Date;
  sell_price: number;
  tenant_id: ObjectId = new ObjectId();
  barcode: string;
  food_type: string[];
  updated_at: Date;
  name: string;
  status: boolean;

  constructor(data={}){
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
    this.store_id = ObjectId.of(this.store_id);
  }
}

export class Category {
  name: string;
  products: Product[] = [];

  constructor(data={}){
    Object.assign(this, data);
    if(this.products.length > 0){
      this.products = this.products.map(x=>new Product(x));
    }
  }

  addProduct(item: Product){
    this.products.push(item);
  }
}
