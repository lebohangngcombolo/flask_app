import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalWallet } from './digital-wallet';

describe('DigitalWallet', () => {
  let component: DigitalWallet;
  let fixture: ComponentFixture<DigitalWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalWallet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalWallet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
