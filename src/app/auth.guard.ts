import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const url: string = state.url;

  if (!isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: url } });
    return false;
  }
  return true;
};

// Helper function to check login status
function isLoggedIn(): boolean {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) return false;

  const data = JSON.parse(localStorage.getItem(`${userRole}-loginDetails`));
  if (!data || !data.isLoggedIn) {
    return false;
  }

  const now = new Date();
  const loginDateTime = new Date(data.date_time);
  const diffInMinutes = Math.round((now.getTime() - loginDateTime.getTime()) / 60000);

  if (diffInMinutes >= 60) {
    // Session expired: Reset login details
    data.isLoggedIn = false;
    data.accessToken = null;
    localStorage.setItem(`${userRole}-loginDetails`, JSON.stringify(data));
    return false;
  }

  return true;
}