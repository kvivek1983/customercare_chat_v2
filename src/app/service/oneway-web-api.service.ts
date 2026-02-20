import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { retry, catchError } from 'rxjs/operators';
import { APiProperties } from '../../app/class/api-properties';

@Injectable({
  providedIn: 'root'
})
export class OnewayWebApiService {
  apiProperties: APiProperties = new APiProperties();

  constructor(private http: HttpClient) { }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  getAccessKeyWeb(data : {}) : Observable<{}> {    
    return this.http.post(this.apiProperties.webApiURL+'getAccessKey', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  getDriverAndCabImages(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.webApiURL+'getDriverAndCabImages', data , this.httpOptions).pipe(
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