import { Routes } from '@angular/router';
import { authGuard } from '../../auth.guard';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Base'
    },
    children: [
      {
        path: '',
        redirectTo: 'searchBookingDetailsByBookingId',
        pathMatch: 'full'
      },
      {
        path: 'searchBookingDetailsByBookingId',
        loadComponent: () => import('./search-booking-details-by-booking-id/search-booking-details-by-booking-id.component').then(m => m.SearchBookingDetailsByBookingIdComponent),
        data: {
          title: 'Search Booking Details By Booking Id'
        },
        canActivate : [authGuard]
      },
      {
        path: 'chatGpt',
        loadComponent: () => import('./chat-gpt/chat-gpt.component').then(m => m.ChatGptComponent),
        data: {
          title: 'ChatGpt'
        },
        canActivate : [authGuard]
      },
      {
        path: 'dcoChat',
        loadComponent: () => import('./conversations/conversations.component').then(m => m.ConversationsComponent),
        data: {
          title: 'DCO Chat',
          customerType: 'Partner'
        },
        canActivate : [authGuard]
      },
      {
        path: 'srdpChat',
        loadComponent: () => import('./conversations/conversations.component').then(m => m.ConversationsComponent),
        data: {
          title: 'SRDP Chat',
          customerType: 'SRDP'
        },
        canActivate : [authGuard]
      },
      {
        path: 'dcoInfo',
        loadComponent: () => import('./dco-info/dco-info.component').then(m => m.DcoInfoComponent),
        data: {
          title: 'DCO Info'
        },
        canActivate : [authGuard]
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: {
          title: 'Dashboard'
        },
        canActivate : [authGuard]
      },
      {
        path: 'customerChat',
        loadComponent: () => import('./conversations/conversations.component').then(m => m.ConversationsComponent),
        data: {
          title: 'Customer Chat',
          customerType: 'Customer'
        },
        canActivate : [authGuard]
      },
      {
        path: 'vendorChat',
        loadComponent: () => import('./conversations/conversations.component').then(m => m.ConversationsComponent),
        data: {
          title: 'Vendor Chat',
          customerType: 'Vendor'
        },
        canActivate : [authGuard]
      }
    ]
  }
];
