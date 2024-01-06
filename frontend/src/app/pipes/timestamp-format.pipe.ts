// create a new file timestamp-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'timestampFormat'
})
export class TimestampFormatPipe implements PipeTransform {

  transform(timestamp: number): string {
    const today = new Date();
    const date = new Date(timestamp);

    if (this.isToday(date, today)) {
      return 'Today ' + this.formatTime(date);
    } else if (this.isYesterday(date, today)) {
      return 'Yesterday ' + this.formatTime(date);
    } else {
      return this.formatDate(date) + ' ' + this.formatTime(date);
    }
  }

  private isToday(date: Date, today: Date): boolean {
    return  date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
  }

  private isYesterday(date: Date, today: Date): boolean {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return  date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
  }

  private formatDate(date: Date): string {
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(date, 'shortDate')!;
  }

  private formatTime(date: Date): string {
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(date, 'shortTime')!;
  }
}
