import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-details-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-details-panel.component.html',
  styleUrl: './customer-details-panel.component.scss',
})
export class CustomerDetailsPanelComponent implements OnChanges {
  @Input() chat: any;

  details: any = null;
  customerType: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chat'] && this.chat) {
      this.details = this.chat.customer_details || null;
      this.customerType = this.chat.customer_type || '';
    }
  }

  getDcoStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-active';
      case 'Suspend': return 'badge-suspend';
      case 'Disable': return 'badge-disable';
      default: return '';
    }
  }

  isPartner(): boolean {
    return this.customerType === 'Partner';
  }

  isCustomer(): boolean {
    return this.customerType === 'Customer';
  }
}
