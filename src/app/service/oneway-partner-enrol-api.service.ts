import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { retry, catchError } from 'rxjs/operators';
import { APiProperties } from '../../app/class/api-properties';

@Injectable({
  providedIn: 'root'
})
export class OnewayPartnerEnrolApiService {
  apiProperties: APiProperties = new APiProperties();

  constructor(private http: HttpClient) { }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  getAlternateNumbers(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'getAlternateNumbers', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  getPartner(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'getPartner', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  resendPaytmPaymentLink(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'resendPaytmPaymentLink', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  fetchAllTagsForFreelancer(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'fetchAllTagsForFreelancer', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  fetchMainTags(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'fetchMainTags', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  fetchSubTagsForMainTags(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'fetchSubTagsForMainTags', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  updateDCOStatusByFreelancer(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.partnerEnrollApi+'updateDCOStatusByFreelancer', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server-side error:\nError Code: ${error.status}\nMessage: ${error.message}`;
    }

    // Log the error (optional)
    console.error(errorMessage);

    // Return a user-friendly error message wrapped in an RxJS Error observable
    return throwError(() => new Error(errorMessage));
  }

}