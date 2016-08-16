import { Injectable } from '@angular/core';

@Injectable()
export class FeatureService {
  public static ONLINE_PAYMENT = 'onlinePayment';
  public static GOOGLE_LOGIN = 'googleLogin';

  private static config: any = {
    onlinePayment: true,
    googleLogin: true
  };

  public isEnabled(key: string): boolean {
    return FeatureService.config[key] === true;
  }

  public isDisaled(key: string): boolean {
    return !this.isEnabled(key);
  }

  public onlinePaymentEnabled(): boolean {
    return this.isEnabled(FeatureService.ONLINE_PAYMENT);
  }

  public googleLoginEnabled(): boolean {
    return this.isEnabled(FeatureService.GOOGLE_LOGIN);
  }
}
