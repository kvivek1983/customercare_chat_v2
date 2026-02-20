import { TestBed } from '@angular/core/testing';

import { OnewayWebApiService } from './oneway-web-api.service';

describe('OnewayWebApiService', () => {
  let service: OnewayWebApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnewayWebApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
