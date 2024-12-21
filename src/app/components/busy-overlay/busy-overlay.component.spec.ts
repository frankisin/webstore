import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusyOverlayComponent } from './busy-overlay.component';

describe('BusyOverlayComponent', () => {
  let component: BusyOverlayComponent;
  let fixture: ComponentFixture<BusyOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusyOverlayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusyOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
