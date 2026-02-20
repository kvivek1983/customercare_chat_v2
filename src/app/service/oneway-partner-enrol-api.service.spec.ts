import { TestBed } from '@angular/core/testing';

import { OnewayPartnerEnrolApiService } from './oneway-partner-enrol-api.service';

describe('OnewayPartnerEnrolApiService', () => {
  let service: OnewayPartnerEnrolApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnewayPartnerEnrolApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
