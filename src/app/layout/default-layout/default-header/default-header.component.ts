import { NgClass, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, computed, DestroyRef, EventEmitter, inject, input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

import {
  AvatarComponent,
  BadgeComponent,
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  NavItemComponent,
  NavLinkDirective,
  ProgressBarDirective,
  ProgressComponent,
  SidebarToggleDirective,
  TextColorDirective,
  ThemeDirective
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';
import { OnewayNodeService } from '../../../service/oneway-node.service';
import { ChatService } from '../../../service/chat.service';
import { DashboardStats, ExecutiveStatus } from '../../../models/chat.model';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrl: './default-header.component.scss',
  standalone: true,
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, NavItemComponent, NavLinkDirective, RouterLink, RouterLinkActive, NgTemplateOutlet, BreadcrumbRouterComponent, ThemeDirective, DropdownComponent, DropdownToggleDirective, TextColorDirective, AvatarComponent, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, BadgeComponent, DropdownDividerDirective, ProgressBarDirective, ProgressComponent, NgStyle, NgClass, NgIf]
})
export class DefaultHeaderComponent extends HeaderComponent {

  /** Emits when hamburger menu icon is clicked */
  @Output() menuToggle = new EventEmitter<void>();

  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;
  private destroyRef = inject(DestroyRef);

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' },
    { name: 'auto', text: 'Auto', icon: 'cilContrast' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  // Theme
  isLightMode = false;
  userInitials = 'U';

  // Dashboard Stats (Step 3)
  dashboardStats: DashboardStats = { active: 0, resolved: 0, pending: 0 };

  // Executive Status Toggle (Step 4)
  executiveStatus: ExecutiveStatus = 'OFFLINE';

  constructor(
    private ons: OnewayNodeService,
    private router: Router,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {
    super();

    // Restore executive status from localStorage (persist across page refresh)
    const savedStatus = localStorage.getItem('executiveStatus') as ExecutiveStatus | null;
    if (savedStatus === 'ONLINE' || savedStatus === 'OFFLINE') {
      this.executiveStatus = savedStatus;
    }

    // Restore theme from localStorage
    this.isLightMode = localStorage.getItem('theme') === 'light';
    if (this.isLightMode) {
      document.body.classList.add('light-mode');
    }

    // Derive user initials from login details
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      try {
        const loginData = JSON.parse(localStorage.getItem(userRole + '-loginDetails') || '{}');
        const name = loginData.name || loginData.userName || '';
        if (name) {
          const parts = name.trim().split(/\s+/);
          this.userInitials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.substring(0, 2).toUpperCase();
        }
      } catch (_) {}
    }

    // Subscribe to dashboard stats updates (Step 3)
    this.chatService.onDashboardStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats: DashboardStats) => {
        console.log('Dashboard stats received:', stats);
        this.dashboardStats = stats;
        this.cdr.markForCheck();
      });

    // Request initial stats from server (Step 6 debug)
    // Small delay to ensure socket is connected before emitting
    setTimeout(() => {
      this.chatService.fetchDashboardStats();
    }, 1500);
  }

  sidebarId = input('sidebar1');

  // Theme toggle
  toggleTheme(): void {
    this.isLightMode = !this.isLightMode;
    document.body.classList.toggle('light-mode', this.isLightMode);
    localStorage.setItem('theme', this.isLightMode ? 'light' : 'dark');
  }

  // Executive Status Toggle (Step 4)
  toggleExecutiveStatus(): void {
    this.executiveStatus = this.executiveStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    localStorage.setItem('executiveStatus', this.executiveStatus);
    this.chatService.setExecutiveStatus({ status: this.executiveStatus });
  }

  responseData: any = [];
  logout() {
    console.log("Logout");

    // Set status to OFFLINE before disconnecting (Step 4)
    this.chatService.setExecutiveStatus({ status: 'OFFLINE' });
    localStorage.removeItem('executiveStatus');

    // Disconnect socket (Step 2)
    this.chatService.disconnect();

    var userRole = localStorage.getItem('userRole');
    const data = JSON.parse(localStorage.getItem(userRole + "-loginDetails")!);

    if (data == null) {
      this.router.navigate(['/login']);
      return;
    }

    var requestData = {
      token: data.accessToken
    };

    this.ons.logout(JSON.stringify(requestData)).subscribe({
      next: (data: {}) => {
        this.responseData = data;
      },
      error: (error) => {
        console.log("Logout Error:", error);
      }
    });

    data.isLoggedIn = false;
    data.accessToken = null;

    localStorage.setItem(userRole + "-loginDetails", JSON.stringify(data));

    this.router.navigate(['/login']);
  }

}
