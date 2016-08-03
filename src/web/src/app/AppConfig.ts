export class AppConfig {
  static BASE_URL:string = AppConfig.getBaseUrl();
  static STORES_URL:string = AppConfig.BASE_URL+"/stores";
  static STORE_URL:string = AppConfig.BASE_URL+"/store";
  static PRODUCTS_URL:string = AppConfig.BASE_URL+"/products";
  static PRODUCT_URL:string = AppConfig.BASE_URL+"/product";
  static POPULAR_DISHES_URL:string = AppConfig.BASE_URL+"/popular_items";
  static ORDER_URL:string = AppConfig.BASE_URL+"/order";
  static TRACK_URL:string = AppConfig.BASE_URL+"/track";
  static PINCODE_URL:string = AppConfig.BASE_URL+"/pincodes";

  static getBaseUrl(){
    return AppConfig.getBaseHost() + "/api";
  }

  static getBaseHost() : string {
    let host = window.location.host,
      port = window.location.port;
    if (AppConfig.isLocalEnv()) {
      return 'http://localhost:4000';
    } else {
      return 'http://'+ host + ':' + port;
    }
  }

  static isLocalEnv() : boolean {
    return (window.location.host.match(/localhost/)) !== null;
  }
}
