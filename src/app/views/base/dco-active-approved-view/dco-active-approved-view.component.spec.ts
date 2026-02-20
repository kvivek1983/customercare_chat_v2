import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DcoActiveApprovedViewComponent } from './dco-active-approved-view.component';

describe('DcoActiveApprovedViewComponent', () => {
  let component: DcoActiveApprovedViewComponent;
  let fixture: ComponentFixture<DcoActiveApprovedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcoActiveApprovedViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DcoActiveApprovedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
