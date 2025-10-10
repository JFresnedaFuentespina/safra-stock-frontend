import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CocinaCentralComponent } from './cocina-central.component';

describe('CocinaCentralComponent', () => {
  let component: CocinaCentralComponent;
  let fixture: ComponentFixture<CocinaCentralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocinaCentralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CocinaCentralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
