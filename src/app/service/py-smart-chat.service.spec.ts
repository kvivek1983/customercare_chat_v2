import { TestBed } from '@angular/core/testing';

import { PySmartChatService } from './py-smart-chat.service';

describe('PySmartChatService', () => {
  let service: PySmartChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PySmartChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
