import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private mobileNumberSource = new BehaviorSubject<string | null>(null);
  currentMobileNumber$ = this.mobileNumberSource.asObservable();

  setMobileNumber(mobile: string) {
    this.mobileNumberSource.next(mobile);
  }

  clearMobileNumber() {
    this.mobileNumberSource.next(null);
  }

}