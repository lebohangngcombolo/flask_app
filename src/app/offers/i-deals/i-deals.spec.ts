import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IDeals } from './i-deals';

describe('IDeals', () => {
  let component: IDeals;
  let fixture: ComponentFixture<IDeals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IDeals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IDeals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
