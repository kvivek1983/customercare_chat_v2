import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RightPanelTab } from '../../models/chat.model';

interface TabDef {
  key: RightPanelTab;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-right-panel-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rp-tabs">
      <button *ngFor="let tab of tabs"
              class="rp-tab"
              [class.rp-tab--active]="tab.key === activeTab"
              (click)="tabChange.emit(tab.key)">
        <svg class="rp-tab-icon" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path [attr.d]="tab.icon"></path>
        </svg>
        <span class="rp-tab-label">{{ tab.label }}</span>
      </button>
    </div>
  `,
  styles: [`
    .rp-tabs {
      display: flex;
      border-bottom: 1px solid #e0e0e0;
      background: #fff;
      padding: 0 4px;
      gap: 0;
    }
    .rp-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 10px 6px;
      border: none;
      background: transparent;
      color: #95a5a6;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      font-family: inherit;
      white-space: nowrap;
      letter-spacing: 0.3px;
    }
    .rp-tab:hover {
      color: #2c3e50;
    }
    .rp-tab--active {
      color: #3498db;
      border-bottom-color: #3498db;
    }
    .rp-tab-icon {
      flex-shrink: 0;
    }
    .rp-tab-label {
      letter-spacing: 0.3px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RightPanelTabsComponent {
  @Input() activeTab: RightPanelTab = 'profile';
  @Output() tabChange = new EventEmitter<RightPanelTab>();

  tabs: TabDef[] = [
    { key: 'profile',  label: 'Profile',  icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z' },
    { key: 'rides',    label: 'Rides',    icon: 'M5 17h14 M5 17a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2 M7 21l5-4 5 4' },
    { key: 'context',  label: 'Context',  icon: 'M12 8v4l3 3 M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'actions',  label: 'Actions',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'notes',    label: 'Notes',    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  ];
}
