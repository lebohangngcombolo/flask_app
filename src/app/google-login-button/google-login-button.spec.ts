import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleLoginButton } from './google-login-button';

describe('GoogleLoginButton', () => {
  let component: GoogleLoginButton;
  let fixture: ComponentFixture<GoogleLoginButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleLoginButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleLoginButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
