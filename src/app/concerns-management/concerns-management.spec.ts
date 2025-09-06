import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcernsManagement } from './concerns-management';

describe('ConcernsManagement', () => {
  let component: ConcernsManagement;
  let fixture: ComponentFixture<ConcernsManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcernsManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcernsManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
