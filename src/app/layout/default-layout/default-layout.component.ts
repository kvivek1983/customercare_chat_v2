import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ChatService } from '../../service/chat.service';
import { NgScrollbar } from 'ngx-scrollbar';

import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  standalone: true,
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    RouterLink,
    IconDirective,
    NgScrollbar,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    DefaultHeaderComponent,
    ShadowOnScrollDirective,
    ContainerComponent,
    RouterOutlet,
    DefaultFooterComponent
  ]
})
export class DefaultLayoutComponent {
  public navItems = navItems;
  private chatService = inject(ChatService);

  constructor() {
    // Reconnect socket on page refresh if token exists in localStorage
    this.reconnectSocketIfNeeded();
  }

  private reconnectSocketIfNeeded(): void {
    if (this.chatService.isConnected) return;

    const userRole = localStorage.getItem('userRole');
    if (!userRole) return;

    const rawData = localStorage.getItem(`${userRole}-loginDetails`);
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data && data.isLoggedIn && data.accessToken) {
        this.chatService.connect(data.accessToken);
        // Re-emit saved executive status to sync with backend after reconnect
        const savedStatus = localStorage.getItem('executiveStatus');
        if (savedStatus === 'ONLINE') {
          this.chatService.setExecutiveStatus({ status: 'ONLINE' });
        }
      }
    } catch (e) {
      console.error('Failed to parse login details for socket reconnection:', e);
    }
  }

  onScrollbarUpdate($event: any) {
    // if ($event.verticalUsed) {
    // console.log('verticalUsed', $event.verticalUsed);
    // }
  }

  sidebarId = input('sidebar1');

  // @ViewChild('sidebar1', { static: true }) sidebar!: SidebarComponent;
  // // Method to close the sidebar
  // closeSidebar(): void {
  //   this.sidebar.visible = true; // Hides the sidebar
  // }

}