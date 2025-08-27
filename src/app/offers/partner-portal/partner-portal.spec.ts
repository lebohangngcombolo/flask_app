import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerPortal } from './partner-portal';

describe('PartnerPortal', () => {
  let component: PartnerPortal;
  let fixture: ComponentFixture<PartnerPortal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerPortal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerPortal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
