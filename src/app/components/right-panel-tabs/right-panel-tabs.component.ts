import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RightPanelTab } from '../../models/chat.model';

interface TabDef {
  key: RightPanelTab;
  label: string;
  icon: string;
  fillIcon?: boolean;
}

@Component({
  selector: 'app-right-panel-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rp-icon-bar">
      <button *ngFor="let tab of tabs"
              class="rp-icon-btn"
              [class.rp-icon-btn--active]="tab.key === activeTab"
              [title]="tab.label"
              (click)="tabChange.emit(tab.key)">
        <svg class="rp-icon" width="18" height="18" viewBox="0 0 24 24"
             [attr.fill]="tab.fillIcon ? 'currentColor' : 'none'"
             [attr.stroke]="tab.fillIcon ? 'none' : 'currentColor'"
             [attr.stroke-width]="tab.fillIcon ? '0' : '2'"
             stroke-linecap="round" stroke-linejoin="round">
          <path [attr.d]="tab.icon"></path>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .rp-icon-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 48px;
      min-width: 48px;
      padding: 8px 0;
      gap: 2px;
      background: var(--surface);
      border-right: 1px solid var(--border);
    }
    .rp-icon-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .rp-icon-btn:hover {
      color: var(--text);
      background: var(--surface-hover);
    }
    .rp-icon-btn--active {
      color: var(--accent);
      background: var(--accent-glow);
    }
    .rp-icon-btn--active::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 2.5px;
      height: 20px;
      border-radius: 0 2px 2px 0;
      background: var(--accent);
    }
    .rp-icon {
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RightPanelTabsComponent {
  @Input() activeTab: RightPanelTab = 'profile';
  /** Restrict visible tabs by key (if empty, show all) */
  @Input() visibleTabs: string[] = [];
  @Output() tabChange = new EventEmitter<RightPanelTab>();

  private allTabs: TabDef[] = [
    { key: 'profile',  label: 'Profile',  icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z' },
    { key: 'rides',    label: 'Rides',    icon: 'M5 17h14 M5 17a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2 M7 21l5-4 5 4' },
    { key: 'context',  label: 'Context',  icon: 'M12 8v4l3 3 M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'actions',  label: 'Actions',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'notes',    label: 'Notes',    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { key: 'documents', label: 'Documents', icon: 'M9 12h6 M9 16h6 M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-5-7z M13 2v7h7' },
    { key: 'finance', label: 'Finance', fillIcon: true, icon: 'M12.9494914,6 C13.4853936,6.52514205 13.8531598,7.2212202 13.9645556,8 L17.5,8 C17.7761424,8 18,8.22385763 18,8.5 C18,8.77614237 17.7761424,9 17.5,9 L13.9645556,9 C13.7219407,10.6961471 12.263236,12 10.5,12 L7.70710678,12 L13.8535534,18.1464466 C14.0488155,18.3417088 14.0488155,18.6582912 13.8535534,18.8535534 C13.6582912,19.0488155 13.3417088,19.0488155 13.1464466,18.8535534 L6.14644661,11.8535534 C5.83146418,11.538571 6.05454757,11 6.5,11 L10.5,11 C11.709479,11 12.7183558,10.1411202 12.9499909,9 L6.5,9 C6.22385763,9 6,8.77614237 6,8.5 C6,8.22385763 6.22385763,8 6.5,8 L12.9499909,8 C12.7183558,6.85887984 11.709479,6 10.5,6 L6.5,6 C6.22385763,6 6,5.77614237 6,5.5 C6,5.22385763 6.22385763,5 6.5,5 L10.5,5 L17.5,5 C17.7761424,5 18,5.22385763 18,5.5 C18,5.77614237 17.7761424,6 17.5,6 L12.9494914,6 Z' },
    { key: 'performance', label: 'Performance', icon: 'M3 3v18h18 M7 16l4-4 4 4 4-8' },
    { key: 'history', label: 'History', icon: 'M12 8v4l3 3 M3.05 11a9 9 0 1118 2 M3 17v4h4' },
  ];

  get tabs(): TabDef[] {
    if (!this.visibleTabs || this.visibleTabs.length === 0) return this.allTabs;
    return this.allTabs.filter(t => this.visibleTabs.includes(t.key));
  }
}
