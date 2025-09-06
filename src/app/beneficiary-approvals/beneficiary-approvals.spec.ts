import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryApprovals } from './beneficiary-approvals';

describe('BeneficiaryApprovals', () => {
  let component: BeneficiaryApprovals;
  let fixture: ComponentFixture<BeneficiaryApprovals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryApprovals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryApprovals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
