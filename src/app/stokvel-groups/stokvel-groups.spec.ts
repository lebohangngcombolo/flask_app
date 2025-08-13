import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StokvelGroupsComponent } from './stokvel-groups';

describe('StokvelGroupsComponent', () => {
  let component: StokvelGroupsComponent;
  let fixture: ComponentFixture<StokvelGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StokvelGroupsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StokvelGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
