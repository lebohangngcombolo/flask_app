import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycManagement } from './kyc-management';

describe('KycManagement', () => {
  let component: KycManagement;
  let fixture: ComponentFixture<KycManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KycManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
