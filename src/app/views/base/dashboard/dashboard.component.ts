import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { PySmartChatService } from '../../../service/py-smart-chat.service';
import { ChatService } from '../../../service/chat.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  constructor(private chatService: ChatService, private pySmartChatService: PySmartChatService) { }

  // Overall totals
  totalValue: number = 0;
  totalActive: number = 0;
  totalResolved: number = 0;
  totalPending: number = 0;

  // Donut chart: shows Active vs Resolved overall
  chartData: any = [];
  donutColorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF4D4F', '#52C41A']
  };

  // Grouped bar chart: Active/Resolved/Pending per customer_type
  groupedBarData: any = [];
  barColorScheme: Color = {
    name: 'statusColors',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF4D4F', '#52C41A', '#FAAD14']
  };

  // Customer type breakdown table
  byTypeData: { name: string; active: number; resolved: number; pending: number; total: number }[] = [];

  getLegendColor(name: string): string {
    const colorMap: any = {
      'Active': '#FF4D4F',
      'Resolved': '#52C41A',
      'Pending': '#FAAD14'
    };
    return colorMap[name] || '#ccc';
  }

  ngOnInit() {
    this.loadStats();
    this.onDashboardStats();
  }

  onDashboardStats() {
    this.chatService.onDashboardStats().subscribe((res: any) => {
      if (res.by_type) {
        this.processStats(res);
      } else {
        this.totalActive = res.active ?? 0;
        this.totalResolved = res.resolved ?? 0;
        this.totalPending = res.pending ?? 0;
        this.totalValue = this.totalActive + this.totalResolved + this.totalPending;
        this.chartData = [
          { name: 'Active', value: this.totalActive },
          { name: 'Resolved', value: this.totalResolved }
        ];
      }
    });
  }

  loadStats() {
    this.pySmartChatService.partner_stats().subscribe((res: any) => {
      if (res.status == 1) {
        this.processStats(res);
      }
    });
  }

  private processStats(res: any) {
    this.totalActive = res.active ?? 0;
    this.totalResolved = res.resolved ?? 0;
    this.totalPending = res.pending ?? 0;
    this.totalValue = res.total ?? (this.totalActive + this.totalResolved + this.totalPending);

    // Donut chart
    this.chartData = [
      { name: 'Active', value: this.totalActive },
      { name: 'Resolved', value: this.totalResolved }
    ];

    // Customer type breakdown
    if (res.by_type) {
      const types = Object.keys(res.by_type).sort();
      this.byTypeData = types.map(t => ({
        name: t,
        active: res.by_type[t].active ?? 0,
        resolved: res.by_type[t].resolved ?? 0,
        pending: res.by_type[t].pending ?? 0,
        total: (res.by_type[t].active ?? 0) + (res.by_type[t].resolved ?? 0) + (res.by_type[t].pending ?? 0),
      }));

      // Grouped bar chart data
      this.groupedBarData = types.map(t => ({
        name: t,
        series: [
          { name: 'Active', value: res.by_type[t].active ?? 0 },
          { name: 'Resolved', value: res.by_type[t].resolved ?? 0 },
          { name: 'Pending', value: res.by_type[t].pending ?? 0 },
        ]
      }));
    }
  }
}
