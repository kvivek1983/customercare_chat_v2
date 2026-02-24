import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContextHistoryItem } from '../../models/chat.model';
import { PySmartChatService } from '../../service/py-smart-chat.service';

@Component({
  selector: 'app-context-history-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ctx-panel">
      <h5 class="ctx-title">Context History</h5>
      <p class="ctx-subtitle">Each context change creates a new chat. Click to view conversation history.</p>

      <div *ngIf="isLoading" class="ctx-loading">Loading...</div>

      <div *ngIf="!isLoading && items.length === 0" class="ctx-empty">
        No context history found.
      </div>

      <div class="ctx-timeline" *ngIf="!isLoading && items.length > 0">
        <div *ngFor="let item of items; let i = index"
             class="ctx-card"
             [class.ctx-card--active]="item.status === 'active'"
             (click)="contextClicked.emit(item)">
          <div class="ctx-card-header">
            <span class="ctx-status-dot"
                  [class.ctx-status-dot--active]="item.status === 'active'"
                  [class.ctx-status-dot--resolved]="item.status === 'resolved'">
            </span>
            <span class="ctx-date">{{ item.createdAt }}</span>
            <span class="ctx-chat-count">{{ item.chatCount }} messages</span>
          </div>
          <div class="ctx-card-body">
            <div *ngFor="let key of objectKeys(item.context)" class="ctx-field">
              <span class="ctx-field-key">{{ key }}:</span>
              <span class="ctx-field-value"
                    [class.ctx-value--success]="item.context[key] === 'Active' || item.context[key] === 'Approved'"
                    [class.ctx-value--warning]="item.context[key] === 'Pending'"
                    [class.ctx-value--danger]="item.context[key] === 'Suspended'">
                {{ item.context[key] }}
              </span>
            </div>
          </div>
          <div class="ctx-card-footer">
            <span class="ctx-badge" [class.ctx-badge--active]="item.status === 'active'">
              {{ item.status | uppercase }}
            </span>
            <span *ngIf="item.status === 'active'" class="ctx-current-label">CURRENT CONTEXT</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ctx-panel { padding: 4px 0; }
    .ctx-title {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .ctx-subtitle {
      font-size: 11px; color: var(--text-muted);
      margin-bottom: 12px; line-height: 1.4;
    }
    .ctx-loading, .ctx-empty {
      text-align: center; color: var(--text-muted);
      font-size: 12px; padding: 20px 0;
    }
    .ctx-timeline {
      display: flex; flex-direction: column; gap: 10px;
    }
    .ctx-card {
      padding: 10px 12px; border: 1px solid var(--border);
      border-radius: 10px; background: var(--bg);
      cursor: pointer; transition: border-color 0.15s;
    }
    .ctx-card:hover {
      border-color: var(--accent);
    }
    .ctx-card--active {
      border-color: var(--accent);
      background: var(--accent-glow);
    }
    .ctx-card-header {
      display: flex; align-items: center;
      gap: 8px; margin-bottom: 8px;
    }
    .ctx-status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--text-muted); flex-shrink: 0;
    }
    .ctx-status-dot--active { background: var(--accent); }
    .ctx-status-dot--resolved { background: var(--text-muted); }
    .ctx-date {
      font-size: 12px; font-weight: 600; color: var(--text);
    }
    .ctx-chat-count {
      font-size: 10px; color: var(--text-muted); margin-left: auto;
      font-family: var(--font-mono);
    }
    .ctx-card-body { margin-bottom: 6px; }
    .ctx-field {
      display: flex; gap: 6px;
      font-size: 12px; line-height: 1.6;
    }
    .ctx-field-key {
      font-weight: 600; color: var(--text-muted); min-width: 80px;
    }
    .ctx-field-value { color: var(--text); }
    .ctx-value--success { color: var(--success); font-weight: 600; }
    .ctx-value--warning { color: var(--warning); font-weight: 600; }
    .ctx-value--danger { color: var(--danger); font-weight: 600; }
    .ctx-card-footer {
      display: flex; align-items: center; gap: 8px;
    }
    .ctx-badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px;
      border-radius: 4px; letter-spacing: 0.5px;
      background: rgba(113, 113, 122, 0.15); color: var(--text-muted);
    }
    .ctx-badge--active {
      background: rgba(99, 102, 241, 0.15); color: var(--accent);
    }
    .ctx-current-label {
      font-size: 10px; font-weight: 700;
      color: var(--accent); letter-spacing: 0.5px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextHistoryPanelComponent implements OnChanges {
  @Input() customerNumber: string = '';
  @Output() contextClicked = new EventEmitter<ContextHistoryItem>();

  private destroyRef = inject(DestroyRef);
  items: ContextHistoryItem[] = [];
  isLoading = false;

  constructor(
    private pscs: PySmartChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerNumber'] && this.customerNumber) {
      this.fetchHistory();
    }
  }

  objectKeys(obj: Record<string, string>): string[] {
    return Object.keys(obj);
  }

  private fetchHistory(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.pscs.fetchContextHistory(this.customerNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.items = response.status === 1 ? response.items : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.items = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
