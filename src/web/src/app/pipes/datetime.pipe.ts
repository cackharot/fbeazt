import { Pipe, PipeTransform } from '@angular/core';
// import * as _ from 'lodash';
import * as moment from 'moment';

@Pipe({ name: 'datetime' })
export class DateTimePipe implements PipeTransform {
  transform(dateObj: any, fmt: string = 'DD/MM/YYYY hh:mm A'): string {
    let val = moment.utc(dateObj.$date).format(fmt);
    return val;
  }
}
