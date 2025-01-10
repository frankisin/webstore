import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasinoHomeComponent } from './casino-home.component';

describe('CasinoHomeComponent', () => {
  let component: CasinoHomeComponent;
  let fixture: ComponentFixture<CasinoHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasinoHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CasinoHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
