import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBookingDetailsByBookingIdComponent } from './search-booking-details-by-booking-id.component';

describe('SearchBookingDetailsByBookingIdComponent', () => {
  let component: SearchBookingDetailsByBookingIdComponent;
  let fixture: ComponentFixture<SearchBookingDetailsByBookingIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBookingDetailsByBookingIdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchBookingDetailsByBookingIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
