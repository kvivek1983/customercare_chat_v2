import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { retry, catchError, map } from 'rxjs/operators';
import { APiProperties } from '../../app/class/api-properties';
import { ContextHistoryResponse, DashboardStats, NotesResponse, RidesResponse, TemplatesResponse } from '../../app/models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class PySmartChatService {

  apiProperties: APiProperties = new APiProperties();
  private router = inject(Router);

  constructor(private http: HttpClient) { }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  /** Build headers with JWT Authorization token from localStorage */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const userRole = localStorage.getItem('userRole');
    let token = '';
    if (userRole) {
      try {
        const loginDetails = JSON.parse(localStorage.getItem(userRole + '-loginDetails') || '{}');
        token = loginDetails.accessToken || '';
      } catch (e) { }
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      })
    };
  }

  getChatGPTResponse(data : {}) : Observable<{}> {
    return this.http.post(this.apiProperties.pySmartChatUrl+'api/chats/chat_gpt', data , this.getAuthHeaders()).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  sendWhatsappTemplate(number : any, name : any) : Observable<{}> {
    return this.http.get(this.apiProperties.pySmartChatUrl+'api/chats/send_whatsapp_template?to='+number+'&name='+name, this.getAuthHeaders()).pipe(
      retry(1),
      catchError(this.handleError)
    )
  }

  fetchMediaFile(id : string) : Observable<string>{
    const url = `${this.apiProperties.pySmartChatUrl}api/whatsapp/downloadmedia/${id}`;

    return this.http.get(url, { headers: this.getAuthHeaders().headers, responseType: 'blob' }).pipe(
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

  rateChat(chatId: string, rating: number, executiveId?: string): Observable<any> {
    const body: any = { rating };
    if (executiveId) {
      body.executive_id = executiveId;
    }
    return this.http.post(
      `${this.apiProperties.pySmartChatV2RateUrl}/${chatId}/rate`,
      body,
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 2: Context History
  fetchContextHistory(customerNumber: string): Observable<ContextHistoryResponse> {
    return this.http.get<ContextHistoryResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${customerNumber}/context-history`,
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 3: Rides
  fetchRides(customerNumber: string): Observable<RidesResponse> {
    return this.http.get<RidesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${customerNumber}/rides`,
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 5: Internal Notes
  fetchNotes(chatId: string): Observable<NotesResponse> {
    return this.http.get<NotesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/chats/${chatId}/notes`,
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Phase 4 Step 6: Templates
  fetchTemplates(stakeholderType: string): Observable<TemplatesResponse> {
    return this.http.get<TemplatesResponse>(
      `${this.apiProperties.pySmartChatUrl}api/templates?stakeholder=${stakeholderType}`,
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  partner_stats() : Observable<DashboardStats> {
    return this.http.get<any>(this.apiProperties.pySmartChatUrl+'api/dashboard/stats', this.getAuthHeaders()).pipe(
      retry(1),
      map((res: any) => {
        // V2 wraps stats in { status: 1, data: { active, resolved, awaiting_customer_response } }
        const raw = res.data || res;
        return {
          active: raw.active ?? 0,
          resolved: raw.resolved ?? 0,
          pending: raw.pending ?? raw.awaiting_customer_response ?? 0,
        } as DashboardStats;
      }),
      catchError(this.handleError)
    )
  }

  /** V2 logout — blacklist token on backend */
  logoutV2(token: string): Observable<any> {
    return this.http.post(
      `${this.apiProperties.pySmartChatUrl}api/auth/logout`,
      { token },
      this.httpOptions
    ).pipe(
      catchError((err) => {
        console.warn('V2 logout failed (non-critical):', err);
        return of({ status: 0 });
      })
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error:\nError Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);

    // 401 Unauthorized → clear session and force login
    if (error.status === 401) {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        localStorage.removeItem(userRole + '-loginDetails');
      }
      localStorage.removeItem('userRole');
      localStorage.removeItem('executiveStatus');
      this.router.navigate(['/login']);
    }

    return throwError(() => new Error(errorMessage));
  }

}
