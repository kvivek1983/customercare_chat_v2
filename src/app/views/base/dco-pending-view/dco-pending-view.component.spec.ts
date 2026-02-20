import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DcoPendingViewComponent } from './dco-pending-view.component';

describe('DcoPendingViewComponent', () => {
  let component: DcoPendingViewComponent;
  let fixture: ComponentFixture<DcoPendingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcoPendingViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DcoPendingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
