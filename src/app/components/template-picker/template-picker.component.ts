import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WhatsAppTemplate } from '../../models/chat.model';
import { PySmartChatService } from '../../service/py-smart-chat.service';

@Component({
  selector: 'app-template-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tp-panel" *ngIf="isExpanded">
      <div class="tp-header">
        <h5 class="tp-title">WhatsApp Templates</h5>
        <button class="tp-close" (click)="closed.emit()">&times;</button>
      </div>

      <div *ngIf="isLoading" class="tp-loading">Loading templates...</div>

      <div *ngIf="!isLoading && templates.length === 0" class="tp-empty">
        No templates available.
      </div>

      <div class="tp-list" *ngIf="!isLoading && templates.length > 0">
        <div *ngFor="let tmpl of templates"
             class="tp-card"
             (click)="templateSelected.emit(tmpl)">
          <div class="tp-card-header">
            <span class="tp-name">{{ tmpl.name }}</span>
            <span class="tp-lang-badge">{{ tmpl.language }}</span>
          </div>
          <div class="tp-preview">{{ tmpl.content }}</div>
          <div class="tp-category">{{ tmpl.category }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tp-panel {
      border: 1px solid #e0e0e0; border-radius: 10px;
      background: #fff; margin-bottom: 8px;
      max-height: 280px; overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .tp-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid #f0f0f0;
      position: sticky; top: 0; background: #fff; z-index: 1;
    }
    .tp-title {
      font-size: 13px; font-weight: 700; color: #2c3e50;
      margin: 0;
    }
    .tp-close {
      background: none; border: none; font-size: 20px;
      color: #95a5a6; cursor: pointer; line-height: 1;
      padding: 0 4px;
    }
    .tp-close:hover { color: #e74c3c; }
    .tp-loading, .tp-empty {
      text-align: center; color: #95a5a6;
      font-size: 13px; padding: 20px 0;
    }
    .tp-list {
      display: flex; flex-direction: column;
      gap: 1px; background: #f0f0f0;
    }
    .tp-card {
      padding: 10px 14px; background: #fff;
      cursor: pointer;
      transition: background 0.15s;
    }
    .tp-card:hover { background: #f7fafc; }
    .tp-card-header {
      display: flex; align-items: center;
      gap: 8px; margin-bottom: 4px;
    }
    .tp-name {
      font-size: 13px; font-weight: 600; color: #2c3e50;
    }
    .tp-lang-badge {
      font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 4px;
      background: rgba(52, 152, 219, 0.12); color: #3498db;
      letter-spacing: 0.5px; text-transform: uppercase;
    }
    .tp-preview {
      font-size: 12px; color: #7f8c8d;
      line-height: 1.4; margin-bottom: 4px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .tp-category {
      font-size: 10px; color: #95a5a6;
      font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplatePickerComponent implements OnChanges {
  @Input() stakeholderType: string = '';
  @Input() isExpanded: boolean = false;
  @Output() templateSelected = new EventEmitter<WhatsAppTemplate>();
  @Output() closed = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  templates: WhatsAppTemplate[] = [];
  isLoading = false;
  private hasFetched = false;

  constructor(
    private pscs: PySmartChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Fetch on first expand
    if (changes['isExpanded'] && this.isExpanded && !this.hasFetched && this.stakeholderType) {
      this.fetchTemplates();
    }
  }

  private fetchTemplates(): void {
    this.isLoading = true;
    this.hasFetched = true;
    this.cdr.markForCheck();
    this.pscs.fetchTemplates(this.stakeholderType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.templates = response.status === 1 ? response.templates : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.templates = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
