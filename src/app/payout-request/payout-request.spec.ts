import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayoutRequestComponent } from './payout-request';

describe('PayoutRequestComponent', () => {
  let component: PayoutRequestComponent;
  let fixture: ComponentFixture<PayoutRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PayoutRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
