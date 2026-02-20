import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatNumberListComponent } from './chat-number-list.component';

describe('ChatNumberListComponent', () => {
  let component: ChatNumberListComponent;
  let fixture: ComponentFixture<ChatNumberListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatNumberListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatNumberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
