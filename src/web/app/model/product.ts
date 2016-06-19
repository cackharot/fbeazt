import { ObjectId, Date } from "./base";

export class Product {
  _id: ObjectId;
  deliver_time: number;
  cuisine: string;
  buy_price: number;
  open_time: number;
  store_id: ObjectId;
  discount: number;
  close_time: number;
  category: string;
  created_at: Date;
  sell_price: number;
  tenant_id: ObjectId;
  barcode: string;
  food_type: string[];
  updated_at: Date;
  name: string;
  status: boolean;
}

export class Category {
  name: string;
  products: Product[];

  constructor(name: string){
    this.name = name;
    this.products = [];
  }

  addProduct(item: Product){
    this.products.push(item);
  }
}
