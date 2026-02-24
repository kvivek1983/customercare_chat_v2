import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, inject, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InternalNote } from '../../models/chat.model';
import { PySmartChatService } from '../../service/py-smart-chat.service';
import { ChatService } from '../../service/chat.service';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes-panel">
      <h5 class="notes-title">Internal Notes</h5>

      <!-- Add Note Form -->
      <div class="notes-form">
        <textarea
          class="notes-textarea"
          [(ngModel)]="newNoteContent"
          placeholder="Write an internal note..."
          rows="3">
        </textarea>
        <button
          class="notes-add-btn"
          [disabled]="!newNoteContent.trim()"
          (click)="addNote()">
          Add Note
        </button>
      </div>

      <div *ngIf="isLoading" class="notes-loading">Loading...</div>

      <div *ngIf="!isLoading && notes.length === 0" class="notes-empty">
        No notes yet. Add one above.
      </div>

      <!-- Notes List -->
      <div class="notes-list" *ngIf="!isLoading && notes.length > 0">
        <div *ngFor="let note of notes" class="note-card">
          <div class="note-header">
            <div class="note-avatar">
              {{ note.author_name | slice:0:2 | uppercase }}
            </div>
            <div class="note-meta">
              <span class="note-author">{{ note.author_name }}</span>
              <span class="note-time">{{ note.created_at }}</span>
            </div>
          </div>
          <div class="note-content">{{ note.content }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notes-panel { padding: 4px 0; }
    .notes-title {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .notes-form {
      margin-bottom: 16px;
    }
    .notes-textarea {
      width: 100%; padding: 10px 12px;
      border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg); color: var(--text);
      font-size: 13px; font-family: inherit;
      resize: vertical; min-height: 60px;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    .notes-textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }
    .notes-textarea::placeholder { color: var(--text-muted); }
    .notes-add-btn {
      margin-top: 8px;
      padding: 8px 20px;
      background: var(--accent); color: #fff;
      border: none; border-radius: 6px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.15s;
    }
    .notes-add-btn:hover:not(:disabled) { opacity: 0.85; }
    .notes-add-btn:disabled {
      background: var(--border); color: var(--text-muted); cursor: not-allowed;
    }
    .notes-loading, .notes-empty {
      text-align: center; color: var(--text-muted);
      font-size: 12px; padding: 20px 0;
    }
    .notes-list {
      display: flex; flex-direction: column; gap: 10px;
    }
    .note-card {
      padding: 10px 12px;
      border: 1px solid var(--border); border-radius: 10px;
      background: var(--bg);
    }
    .note-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 8px;
    }
    .note-avatar {
      width: 28px; height: 28px;
      border-radius: 7px; background: rgba(99, 102, 241, 0.12);
      color: var(--accent); font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .note-meta {
      display: flex; flex-direction: column;
    }
    .note-author {
      font-size: 12px; font-weight: 600; color: var(--accent);
    }
    .note-time {
      font-size: 10px; color: var(--text-muted);
      font-family: var(--font-mono);
    }
    .note-content {
      font-size: 13px; color: var(--text);
      line-height: 1.5; white-space: pre-wrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesPanelComponent implements OnChanges {
  @Input() chatId: string = '';

  private destroyRef = inject(DestroyRef);
  notes: InternalNote[] = [];
  newNoteContent = '';
  isLoading = false;

  constructor(
    private pscs: PySmartChatService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatId'] && this.chatId) {
      this.fetchNotes();
      this.listenForNewNotes();
    }
  }

  addNote(): void {
    const content = this.newNoteContent.trim();
    if (!content || !this.chatId) return;
    this.chatService.addNote({ chat_id: this.chatId, content });
    this.newNoteContent = '';
  }

  private fetchNotes(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.pscs.fetchNotes(this.chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.notes = response.status === 1 ? response.notes : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.notes = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private listenForNewNotes(): void {
    this.chatService.onNoteAdded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((note) => {
        if (note.chat_id === this.chatId) {
          this.notes = [note, ...this.notes];
          this.cdr.markForCheck();
        }
      });
  }
}
