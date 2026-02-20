import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { PySmartChatService } from '../../../service/py-smart-chat.service';
import { ChatService } from '../../../service/chat.service';
import { curveBasis } from 'd3-shape';

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

  curveBasis = curveBasis;

  constructor(private chatService : ChatService, private pySmartChatService : PySmartChatService) { }

  data = [
    {
      name: 'Messages',
      series: [
        { name: 'Apr 1', value: 20 },
        { name: 'Apr 2', value: 50 },
        { name: 'Apr 3', value: 30 },
        { name: 'Apr 4', value: 90 },
        { name: 'Apr 5', value: 65 },
        { name: 'Apr 6', value: 70 },
        { name: 'Apr 7', value: 45 }
      ]
    }
  ];

  donutData = [
    { name: 'Active', value: 18.6 },
    //{ name: 'SA', value: 3.9 },
    { name: 'Resolved', value: 3.2 }
    //{ name: 'VIC', value: 0 }
  ];
  
  donutColorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF4D4F', '#52C41A']
  };
  
  lineChartColorScheme: Color = {
    name: 'unattendedLine',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#4caf50']
  };

  getLegendColor(name: string): string {
    const colorMap: any = {
      'Active': '#FF4D4F',
      'SA': '#FAAD14',
      'Resolved': '#52C41A',
      'VIC': '#A0A0A0'
    };
    return colorMap[name] || '#ccc';
  }

  chartData : any = [];
  totalValue: number = 0;
  unattendedChartData : any = [];

  ngOnInit(){
    this.partnerStats();
    this.onDriverChatStats();
  }

  onDriverChatStats(){
    this.chatService.onDriverChatStats().subscribe((res: any) => {
      console.log('New onDriverChatStats received:', res);

      this.totalValue = res.total;
      this.chartData = res.data;
      //this.unattendedChartData = [];
      this.unattendedChartData = [...[{ name: 'Unattended', series: [...(res.unattended ?? [])] }]];

    });
  }

  partnerStats(){
    this.pySmartChatService.partner_stats().subscribe((res: any) => {
      console.log('New partnerStats received:', res);

      if(res.status == 1){
        this.totalValue = res.total;
        this.chartData = res.data;
        //this.unattendedChartData = [];
        this.unattendedChartData = [...[{ name: 'Unattended', series: [...(res.unattended ?? [])] }]];
      }

    });
  }

  formatYAxisTick(value: number): string {
    // Only show ticks divisible by 5
    return value % 5 === 0 ? value.toString() : '';
  }

  getYMaxValue(): number {
    const allValues = this.unattendedChartData[0]?.series?.map((s : any) => s.value) || [0];
  return Math.ceil(Math.max(...allValues, 5) / 5) * 5; // round up to next 5
  }

  formatTimeTicks(value: string): string {
    // Show only every hour clearly
    const [h, m] = value.split(':');
    return parseInt(m) === 0 ? `${h}:00` : '';
  }

}
