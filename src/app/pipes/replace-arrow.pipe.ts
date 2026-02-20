import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceArrow',
  standalone: true
})
export class ReplaceArrowPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value; // Return if value is null or undefined
    return value.replace(/->/g, ' To '); // Replace all occurrences of `->` with ` To `
  }

}
