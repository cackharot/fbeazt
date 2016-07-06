export class AppConfig {
  static BASE_URL:string = AppConfig.getBaseUrl();
  static STORES_URL:string = AppConfig.BASE_URL+"/stores";
  static STORE_URL:string = AppConfig.BASE_URL+"/store";
  static PRODUCTS_URL:string = AppConfig.BASE_URL+"/products";
  static PRODUCT_URL:string = AppConfig.BASE_URL+"/product";
  static ORDER_URL:string = AppConfig.BASE_URL+"/order";

  static getBaseUrl(){
    if (window.location.host.match(/localhost/)) {
      return 'http://localhost:4000/api';
    } else {
      return 'http://foodbeazt.in/api/';
    }
  }
}
