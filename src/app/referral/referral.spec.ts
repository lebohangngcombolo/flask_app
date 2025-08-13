import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferralComponent } from './referral';

describe('ReferralComponent', () => {
  let component: ReferralComponent;
  let fixture: ComponentFixture<ReferralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferralComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReferralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
