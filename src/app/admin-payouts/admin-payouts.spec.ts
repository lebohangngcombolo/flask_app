import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPayouts } from './admin-payouts';

describe('AdminPayouts', () => {
  let component: AdminPayouts;
  let fixture: ComponentFixture<AdminPayouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPayouts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPayouts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
