import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeBr',
  standalone: true
})
export class RemoveBrPipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/<br\s*\/?>/g, ' '); // Removes <br> tags
  }

}
