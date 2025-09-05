import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StokvelManagement } from './stokvel-management';

describe('StokvelManagement', () => {
  let component: StokvelManagement;
  let fixture: ComponentFixture<StokvelManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StokvelManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StokvelManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
