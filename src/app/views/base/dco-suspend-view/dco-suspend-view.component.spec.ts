import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DcoSuspendViewComponent } from './dco-suspend-view.component';

describe('DcoSuspendViewComponent', () => {
  let component: DcoSuspendViewComponent;
  let fixture: ComponentFixture<DcoSuspendViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcoSuspendViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DcoSuspendViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
