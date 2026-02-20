import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBookingDetailsByIdComponent } from './show-booking-details-by-id.component';

describe('ShowBookingDetailsByIdComponent', () => {
  let component: ShowBookingDetailsByIdComponent;
  let fixture: ComponentFixture<ShowBookingDetailsByIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowBookingDetailsByIdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowBookingDetailsByIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
