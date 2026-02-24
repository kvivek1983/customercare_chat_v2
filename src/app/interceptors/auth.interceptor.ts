import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { APiProperties } from '../class/api-properties';

/** Tracks whether a refresh is currently in progress to avoid duplicate refresh calls */
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Angular functional HTTP interceptor for automatic JWT token refresh.
 * On 401 responses, attempts to refresh the token via POST /api/auth/refresh.
 * If refresh succeeds, retries the original request with the new token.
 * If refresh fails, redirects to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const apiProperties = new APiProperties();

  // Skip interception for auth endpoints (login, refresh, logout)
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handleUnauthorized(req, next, router, http, apiProperties);
      }
      return throwError(() => error);
    })
  );
};

function handleUnauthorized(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  router: Router,
  http: HttpClient,
  apiProperties: APiProperties
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      forceLogout(router);
      return throwError(() => new Error('No refresh token available'));
    }

    return http.post<any>(`${apiProperties.pySmartChatUrl}api/auth/refresh`, {
      refreshToken
    }).pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newAccessToken = response.accessToken;
        const newRefreshToken = response.refreshToken;

        // Update localStorage with new tokens
        updateTokens(newAccessToken, newRefreshToken);
        refreshTokenSubject.next(newAccessToken);

        // Retry original request with new token
        return next(addTokenToRequest(req, newAccessToken));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        console.error('Token refresh failed:', refreshError);
        forceLogout(router);
        return throwError(() => refreshError);
      })
    );
  } else {
    // Another request is already refreshing — wait for the new token
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addTokenToRequest(req, token!)))
    );
  }
}

function addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function getRefreshToken(): string | null {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) return null;
  try {
    const loginData = JSON.parse(localStorage.getItem(`${userRole}-loginDetails`) || '{}');
    return loginData.refreshToken || null;
  } catch {
    return null;
  }
}

function updateTokens(accessToken: string, refreshToken: string): void {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) return;
  try {
    const loginData = JSON.parse(localStorage.getItem(`${userRole}-loginDetails`) || '{}');
    loginData.accessToken = accessToken;
    loginData.refreshToken = refreshToken;
    localStorage.setItem(`${userRole}-loginDetails`, JSON.stringify(loginData));
  } catch (e) {
    console.error('Failed to update tokens:', e);
  }
}

function forceLogout(router: Router): void {
  const userRole = localStorage.getItem('userRole');
  if (userRole) {
    localStorage.removeItem(`${userRole}-loginDetails`);
  }
  localStorage.removeItem('userRole');
  localStorage.removeItem('executiveStatus');
  router.navigate(['/login']);
}
