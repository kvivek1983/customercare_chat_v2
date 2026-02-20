import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, computed, DestroyRef, inject, input } from '@angular/core';
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
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, NavItemComponent, NavLinkDirective, RouterLink, RouterLinkActive, NgTemplateOutlet, BreadcrumbRouterComponent, ThemeDirective, DropdownComponent, DropdownToggleDirective, TextColorDirective, AvatarComponent, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, BadgeComponent, DropdownDividerDirective, ProgressBarDirective, ProgressComponent, NgStyle, NgClass]
})
export class DefaultHeaderComponent extends HeaderComponent {

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

    // Subscribe to dashboard stats updates (Step 3)
    this.chatService.onDashboardStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats: DashboardStats) => {
        this.dashboardStats = stats;
        this.cdr.markForCheck();
      });
  }

  sidebarId = input('sidebar1');

  // Executive Status Toggle (Step 4)
  toggleExecutiveStatus(): void {
    this.executiveStatus = this.executiveStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    this.chatService.setExecutiveStatus({ status: this.executiveStatus });
  }

  responseData: any = [];
  logout() {
    console.log("Logout");

    // Set status to OFFLINE before disconnecting (Step 4)
    this.chatService.setExecutiveStatus({ status: 'OFFLINE' });

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
