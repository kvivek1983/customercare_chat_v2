import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, inject, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RideInfo, SearchHistoryItem } from '../../models/chat.model';
import { PySmartChatService } from '../../service/py-smart-chat.service';

@Component({
  selector: 'app-rides-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rides-panel">
      <div *ngIf="isLoading" class="rides-loading">Loading...</div>

      <div *ngIf="!isLoading">
        <!-- Upcoming Rides Section -->
        <div class="rides-section">
          <h6 class="rides-section-title">UPCOMING RIDES</h6>
          <div *ngIf="upcomingRides.length === 0" class="rides-empty">No upcoming rides.</div>
          <div *ngFor="let ride of upcomingRides" class="ride-card">
            <div class="ride-card-header">
              <span class="ride-id">#{{ ride.id }}</span>
              <span class="ride-type-badge">{{ ride.type }}</span>
            </div>
            <div class="ride-route">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 17h14 M5 17a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2"></path>
              </svg>
              {{ ride.route }}
            </div>
            <div class="ride-date">{{ ride.date }}</div>
          </div>
        </div>

        <!-- Search History Section -->
        <div class="rides-section">
          <h6 class="rides-section-title">SEARCH HISTORY</h6>
          <div *ngIf="searchHistory.length === 0" class="rides-empty">No search history.</div>
          <div *ngFor="let search of searchHistory" class="search-row">
            <span class="search-route">{{ search.from }} &rarr; {{ search.to }}</span>
            <span class="search-date">{{ search.date }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rides-panel { padding: 4px 0; }
    .rides-loading, .rides-empty {
      text-align: center; color: var(--text-muted);
      font-size: 12px; padding: 16px 0;
    }
    .rides-section { margin-bottom: 16px; }
    .rides-section-title {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.5px; text-transform: uppercase;
      margin-bottom: 8px;
    }
    .ride-card {
      padding: 12px 14px; border: 1px solid var(--border);
      border-radius: 10px; margin-bottom: 8px;
      background: var(--bg);
    }
    .ride-card-header {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 6px;
    }
    .ride-id {
      font-size: 13px; font-weight: 700; color: var(--accent);
      font-family: var(--font-mono);
    }
    .ride-type-badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px;
      border-radius: 4px; letter-spacing: 0.5px;
      background: rgba(34, 197, 94, 0.12); color: var(--success);
      text-transform: uppercase;
    }
    .ride-route {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text); margin-bottom: 4px;
    }
    .ride-route svg { stroke: var(--text-muted); }
    .ride-date { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
    .search-row {
      display: flex; justify-content: space-between;
      align-items: center; padding: 8px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
    }
    .search-row:last-child { border-bottom: none; }
    .search-route { color: var(--text); }
    .search-date { color: var(--text-muted); font-size: 10px; font-family: var(--font-mono); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RidesPanelComponent implements OnChanges {
  @Input() customerNumber: string = '';

  private destroyRef = inject(DestroyRef);
  upcomingRides: RideInfo[] = [];
  searchHistory: SearchHistoryItem[] = [];
  isLoading = false;

  constructor(
    private pscs: PySmartChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerNumber'] && this.customerNumber) {
      this.fetchRides();
    }
  }

  private fetchRides(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.pscs.fetchRides(this.customerNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.upcomingRides = response.rides.filter(r => r.status === 'upcoming');
            this.searchHistory = response.searchHistory || [];
          } else {
            this.upcomingRides = [];
            this.searchHistory = [];
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.upcomingRides = [];
          this.searchHistory = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
