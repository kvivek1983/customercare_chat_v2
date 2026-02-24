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
    <div class="rp-icon-bar">
      <button *ngFor="let tab of tabs"
              class="rp-icon-btn"
              [class.rp-icon-btn--active]="tab.key === activeTab"
              [title]="tab.label"
              (click)="tabChange.emit(tab.key)">
        <svg class="rp-icon" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
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
  ];

  get tabs(): TabDef[] {
    if (!this.visibleTabs || this.visibleTabs.length === 0) return this.allTabs;
    return this.allTabs.filter(t => this.visibleTabs.includes(t.key));
  }
}
