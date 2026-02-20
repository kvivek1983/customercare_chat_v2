import { TestBed } from '@angular/core/testing';

import { OnewayNodeService } from './oneway-node.service';

describe('OnewayNodeService', () => {
  let service: OnewayNodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnewayNodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
