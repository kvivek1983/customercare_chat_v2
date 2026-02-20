import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DcoInfoComponent } from './dco-info.component';

describe('DcoInfoComponent', () => {
  let component: DcoInfoComponent;
  let fixture: ComponentFixture<DcoInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcoInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DcoInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
