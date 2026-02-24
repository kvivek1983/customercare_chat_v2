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
  description: string;
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
      <div class="qa-list">
        <button *ngFor="let action of actions"
                class="qa-item"
                [style.--qa-color]="action.color"
                (click)="actionClicked.emit(action.key)">
          <div class="qa-icon-box">
            <svg class="qa-icon" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="action.icon"></path>
            </svg>
          </div>
          <div class="qa-text">
            <span class="qa-label">{{ action.label }}</span>
            <span class="qa-desc">{{ action.description }}</span>
          </div>
          <svg class="qa-chevron" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .qa-panel { padding: 4px 0; }
    .qa-title {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .qa-list {
      display: flex; flex-direction: column; gap: 4px;
    }
    .qa-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border: 1px solid var(--border);
      border-radius: 10px; background: var(--bg);
      cursor: pointer; font-family: inherit;
      transition: border-color 0.15s, background 0.15s;
      text-align: left; width: 100%;
    }
    .qa-item:hover {
      border-color: var(--qa-color, var(--accent));
      background: var(--surface-hover);
    }
    .qa-icon-box {
      width: 34px; height: 34px; min-width: 34px;
      border-radius: 8px; display: flex;
      align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--qa-color, var(--accent)) 12%, transparent);
      color: var(--qa-color, var(--accent));
    }
    .qa-icon { flex-shrink: 0; }
    .qa-text {
      display: flex; flex-direction: column; flex: 1; min-width: 0;
    }
    .qa-label {
      font-size: 12px; font-weight: 600; color: var(--text);
    }
    .qa-desc {
      font-size: 10px; color: var(--text-muted); line-height: 1.3;
    }
    .qa-chevron {
      flex-shrink: 0; color: var(--text-muted);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsPanelComponent {
  @Output() actionClicked = new EventEmitter<QuickAction>();

  actions: ActionDef[] = [
    { key: 'send_template',          label: 'Send Template',     description: 'Send a WhatsApp template message',    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',    color: '#6366F1' },
    { key: 'reassign',               label: 'Reassign Chat',     description: 'Transfer to another executive',       icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', color: '#8B5CF6' },
    { key: 'resolve',                label: 'Mark Resolved',     description: 'Close and resolve this conversation', icon: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',          color: '#22C55E' },
    { key: 'send_resolved_template', label: 'Resolved Template', description: 'Send resolution confirmation',        icon: 'M9 12l2 2 4-4 M21 12a10 10 0 11-20 0 10 10 0 0120 0z',         color: '#16A34A' },
    { key: 'manage_tags',            label: 'Manage Tags',       description: 'Add or remove conversation tags',     icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01', color: '#818CF8' },
    { key: 'pickup_drop_city',       label: 'City Sender',       description: 'Send pickup and drop city info',      icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z', color: '#EAB308' },
  ];
}
