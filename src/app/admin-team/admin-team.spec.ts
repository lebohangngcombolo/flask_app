import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTeam } from './admin-team';

describe('AdminTeam', () => {
  let component: AdminTeam;
  let fixture: ComponentFixture<AdminTeam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTeam);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
