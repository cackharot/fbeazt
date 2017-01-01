import { ObjectId, Date } from './base';
import * as moment from 'moment';

import { AppConfig } from '../AppConfig';

export class StoreTiming {
  day: string;
  time: string;
  fmt_time: string;

  static of(data) {
    if (data && data.constructor.name !== StoreTiming.name) {
      return new StoreTiming(data);
    }
    return data;
  }

  constructor(data: any = {}) {
    Object.assign(this, data);
    this.day = this.day;
    this.time = this.time;
    this.fmt_time = this._formatTime();
  }

  getDay() {
    return this.day;
  }

  getTimes() {
    let tstr = this.time.split(',');
    let res = tstr.map(x => {
      var t = x.split('-');
      return { 'open_time': Number.parseFloat(t[0]), 'close_time': Number.parseFloat(t[1]) };
    });
    return res;
  }

  getFormattedTime() {
    return this.fmt_time;
  }

  _formatTime() {
    let tstr = this.time.split(',');
    let formatted_time_array = tstr.map(x => {
      var t = x.split('-');
      return '' + this._doFmt(Number.parseFloat(t[0])) + " to " + this._doFmt(Number.parseFloat(t[1]));
    });
    return formatted_time_array.join(', ');
  }

  isOpen() {
    let hr = moment().hour() + (moment().minute() / 60);
    let t = this.getTimes();
    for (var i = 0; i < t.length; ++i) {
      let x = t[i];
      if (hr >= x.open_time && hr <= x.close_time) {
        return true;
      }
    }
    return false;
  }

  _doFmt(time_val: number): string {
    if (time_val < 12) {
      return time_val.toFixed(0) + ' AM';
    } else if (time_val === 12) {
      return time_val.toFixed(0) + ' NOON';
    } else if (time_val === 24) {
      return '00 AM';
    } else {
      return (time_val - 12).toFixed(0) + ' PM';
    }
  }
}

export class Restaurant {
  _id: ObjectId = new ObjectId();
  cuisines: string[];
  deliver_time: number;
  phone: string;
  open_time: number;
  close_time: number;
  rating: number = 0.0;
  holidays: string[] = [];
  timings_table: StoreTiming[];
  is_closed: boolean = false;
  tenant_id: ObjectId = new ObjectId();
  created_at: Date;
  food_type: string[];
  address: string;
  name: string;
  status: boolean;
  image_url: string = null;
  day_names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  static of(data) {
    if (data && data.constructor.name !== Restaurant.name) {
      return new Restaurant(data);
    }
    return data;
  }

  constructor(data: any = {}) {
    Object.assign(this, data);
    this._id = ObjectId.of(this._id);
    if (data.timings_table && data.timings_table.length > 0) {
      this.timings_table = data.timings_table.map(x => StoreTiming.of(x));
    }
  }

  getId() {
    return this._id.$oid;
  }

  getTenantId() {
    return this.tenant_id.$oid;
  }

  getCreatedAt() {
    return this.created_at.$date;
  }

  isOpen() {
    return !this.is_closed && this.getTodayStoreTimings().isOpen();
  }

  isClosed() {
    return !this.isOpen();
  }

  isHoliday() {
    let weekday = this.getTodayDayname();
    return this.holidays.some(x => x.toLocaleLowerCase().localeCompare(weekday) === 0);
  }

  getRating() {
    return this.rating === 0 ? '--' : this.rating.toFixed(1);
  }

  getImage() {
    if (!this.image_url) {
      return null;
    }
    return AppConfig.getRestaurantImage(this.image_url);
  }

  getTodayDayname() {
    return this.day_names[moment().weekday()];
  }

  getTodayStoreTimings(): StoreTiming {
    let day = this.getTodayDayname();
    if (this.timings_table && this.timings_table.length > 0) {
      return this.timings_table.filter(x => x.day.toLocaleLowerCase() === day)[0];
    }
    return new StoreTiming({ 'day': day, 'time': this.open_time + '-' + this.close_time });
  }
}
