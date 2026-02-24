import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-sla-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Compact: chat list pill -->
    <span *ngIf="isActive && compact" class="sla-compact"
          [style.color]="color"
          [style.background]="bgColor">
      {{ formattedTime }}
    </span>

    <!-- Full: conversation header -->
    <div *ngIf="isActive && !compact" class="sla-full"
         [style.background]="bgColor"
         [style.border-color]="color + '22'">
      <span class="sla-dot" [class.sla-dot--pulse]="isCritical" [style.background]="color"></span>
      <svg class="sla-clock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
           [attr.stroke]="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span class="sla-time" [style.color]="color">{{ formattedTime }}</span>
      <span *ngIf="isEscalated" class="sla-escalated">ESCALATED</span>
    </div>
  `,
  styles: [`
    .sla-compact {
      display: inline-block;
      font-size: 11px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .sla-full {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid;
    }

    .sla-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .sla-dot--pulse {
      animation: slaPulse 1s infinite;
    }

    @keyframes slaPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .sla-clock-icon {
      flex-shrink: 0;
    }

    .sla-time {
      font-size: 14px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .sla-escalated {
      color: #EF4444;
      font-size: 11px;
      font-weight: 600;
      margin-left: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlaTimerComponent implements OnInit, OnDestroy, OnChanges {

  /** ISO timestamp of last incoming customer message */
  @Input() startTime!: string;

  /** true = compact pill for chat list, false = full header display */
  @Input() compact: boolean = false;

  /** true = timer running (customer waiting), false = hidden */
  @Input() isActive: boolean = true;

  elapsed = 0;
  private timerInterval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  get minutes(): number { return Math.floor(this.elapsed / 60); }
  get seconds(): number { return this.elapsed % 60; }
  get isWarning(): boolean { return this.minutes >= 2 && this.minutes < 3; }
  get isCritical(): boolean { return this.minutes >= 3; }
  get isEscalated(): boolean { return this.minutes >= 10; }

  get formattedTime(): string {
    // Cap at 99:59+ for very old chats (prevents "1362:37" display)
    if (this.minutes >= 100) return '99:59+';
    return `${this.minutes.toString().padStart(2, '0')}:${this.seconds.toString().padStart(2, '0')}`;
  }

  get color(): string {
    if (this.isEscalated) return '#EF4444';
    if (this.isCritical) return '#F97316';
    if (this.isWarning) return '#EAB308';
    return '#6EE7B7';
  }

  get bgColor(): string {
    if (this.isEscalated) return 'rgba(239,68,68,0.12)';
    if (this.isCritical) return 'rgba(249,115,22,0.1)';
    if (this.isWarning) return 'rgba(234,179,8,0.08)';
    return 'rgba(110,231,183,0.08)';
  }

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startTime'] || changes['isActive']) {
      this.restartTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.calculateElapsed();
    this.timerInterval = setInterval(() => {
      this.elapsed++;
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private restartTimer(): void {
    this.clearTimer();
    if (this.isActive && this.startTime) {
      this.startTimer();
    }
  }

  private calculateElapsed(): void {
    if (!this.startTime) {
      this.elapsed = 0;
      return;
    }
    // Parse timestamp — if no timezone info, treat as UTC (MongoDB stores UTC)
    let start: number;
    const ts = this.startTime;
    if (/Z$/.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts) || /[+-]\d{4}$/.test(ts)) {
      // Has timezone info — parse directly
      start = new Date(ts).getTime();
    } else {
      // No timezone info — assume UTC. Append 'Z' so Date parses correctly.
      const normalized = ts.replace(' ', 'T');
      start = new Date(normalized + 'Z').getTime();
    }
    const now = Date.now();
    this.elapsed = Math.max(0, Math.floor((now - start) / 1000));
  }
}
