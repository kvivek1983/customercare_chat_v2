import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { retry, catchError, map } from 'rxjs/operators';
import { APiProperties } from '../../app/class/api-properties';
import { ContextHistoryResponse, NotesResponse, RidesResponse, TemplatesResponse } from '../../app/models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class PySmartChatService {

  apiProperties: APiProperties = new APiProperties();

  constructor(private http: HttpClient) { }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  getChatGPTResponse(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.pySmartChatUrl+'api/chats/chat_gpt', data , this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  sendWhatsappTemplate(number : any, name : any) : Observable<{}> {
    return this.http.get(this.apiProperties.pySmartChatUrl+'api/chats/send_whatsapp_template?to='+number+'&name='+name, this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  fetchMediaFile(id : string) : Observable<string>{
    const url = `${this.apiProperties.pySmartChatUrl}api/whatsapp/downloadmedia/${id}`;

    return this.http.get(url, { headers: this.httpOptions.headers, responseType: 'blob' }).pipe(
      map((response: Blob) => {
        // Convert the Blob response into a URL for display
        console.log(id+"==="+response.type);
        return URL.createObjectURL(response);
      }),
      catchError((error) => {
        console.error('Error fetching media file:', error);
        // Handle errors and return an empty string
        return of('');
      })
    );
  }

  loginV2(data: { username: string; password: string }): Observable<any> {
    return this.http.post(this.apiProperties.pySmartChatV2AuthUrl, data, this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  rateChat(chatId: string, rating: number): Observable<any> {
    return this.http.post(
      `${this.apiProperties.pySmartChatV2RateUrl}/${chatId}/rate`,
      { rating },
      this.httpOptions
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 2: Context History
  fetchContextHistory(customerNumber: string): Observable<ContextHistoryResponse> {
    return this.http.get<ContextHistoryResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${customerNumber}/context-history`,
      this.httpOptions
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 3: Rides
  fetchRides(customerNumber: string): Observable<RidesResponse> {
    return this.http.get<RidesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${customerNumber}/rides`,
      this.httpOptions
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 5: Internal Notes
  fetchNotes(chatId: string): Observable<NotesResponse> {
    return this.http.get<NotesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${chatId}/notes`,
      this.httpOptions
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 6: Templates
  fetchTemplates(stakeholderType: string): Observable<TemplatesResponse> {
    return this.http.get<TemplatesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/templates?stakeholder=${stakeholderType}`,
      this.httpOptions
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  partner_stats() : Observable<{}> {
    return this.http.get(this.apiProperties.pySmartChatUrl+'api/dashboard/partner_stats', this.httpOptions).pipe(
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
