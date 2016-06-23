import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({name: 'chunk'})
export class ChunkPipe implements PipeTransform {
  transform(data: any[], countStr: string): any[] {
    let count = Number.parseInt(countStr);
    return _.chunk(data, count);
  }
}