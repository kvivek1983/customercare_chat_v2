import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, EventEmitter, Output
} from '@angular/core';

export type QuickAction =
  | 'send_template'
  | 'reassign'
  | 'resolve'
  | 'send_resolved_template'
  | 'manage_tags'
  | 'pickup_drop_city';

interface ActionDef {
  key: QuickAction;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-quick-actions-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qa-panel">
      <h5 class="qa-title">Quick Actions</h5>
      <div class="qa-grid">
        <button *ngFor="let action of actions"
                class="qa-btn"
                [style.--qa-color]="action.color"
                (click)="actionClicked.emit(action.key)">
          <svg class="qa-icon" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="action.icon"></path>
          </svg>
          <span class="qa-label">{{ action.label }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .qa-panel { padding: 4px 0; }
    .qa-title {
      font-size: 14px; font-weight: 700; color: #2c3e50;
      margin-bottom: 12px;
    }
    .qa-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .qa-btn {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px; padding: 14px 8px;
      border: 1px solid #e0e0e0; border-radius: 10px;
      background: #fff; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      font-family: inherit; color: var(--qa-color, #2c3e50);
    }
    .qa-btn:hover {
      border-color: var(--qa-color, #3498db);
      background: rgba(0, 0, 0, 0.02);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .qa-icon { flex-shrink: 0; }
    .qa-label {
      font-size: 11px; font-weight: 600;
      text-align: center; line-height: 1.3;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsPanelComponent {
  @Output() actionClicked = new EventEmitter<QuickAction>();

  actions: ActionDef[] = [
    { key: 'send_template',          label: 'Send Template',     icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',    color: '#3498db' },
    { key: 'reassign',               label: 'Reassign Chat',     icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', color: '#9b59b6' },
    { key: 'resolve',                label: 'Mark Resolved',     icon: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',          color: '#1abc9c' },
    { key: 'send_resolved_template', label: 'Resolved Template', icon: 'M9 12l2 2 4-4 M21 12a10 10 0 11-20 0 10 10 0 0120 0z',         color: '#2ecc71' },
    { key: 'manage_tags',            label: 'Manage Tags',       icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01', color: '#818CF8' },
    { key: 'pickup_drop_city',       label: 'City Sender',       icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z', color: '#e67e22' },
  ];
}
