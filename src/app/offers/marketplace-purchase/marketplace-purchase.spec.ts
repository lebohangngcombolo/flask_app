import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketplacePurchase } from './marketplace-purchase';

describe('MarketplacePurchase', () => {
  let component: MarketplacePurchase;
  let fixture: ComponentFixture<MarketplacePurchase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplacePurchase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketplacePurchase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
