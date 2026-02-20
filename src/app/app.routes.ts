import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      },
      {
        path: 'base',
        loadChildren: () => import('./views/base/routes').then((m) => m.routes)
      },
      // {
      //   path: 'theme',
      //   loadChildren: () => import('./views/theme/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'buttons',
      //   loadChildren: () => import('./views/buttons/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'forms',
      //   loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'icons',
      //   loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'notifications',
      //   loadChildren: () => import('./views/notifications/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'widgets',
      //   loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'charts',
      //   loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      // }
      
    ]
  },
  
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'searchBookingDetailsByBookingId',
    loadComponent: () => import('./views/base/search-booking-details-by-booking-id/search-booking-details-by-booking-id.component').then(m => m.SearchBookingDetailsByBookingIdComponent),
    data: {
      title: 'Search Booking Details By Booking Id'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
