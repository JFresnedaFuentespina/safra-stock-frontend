import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStockCocinaCentralComponent } from './new-stock.component';

describe('NewStockComponent', () => {
  let component: NewStockCocinaCentralComponent;
  let fixture: ComponentFixture<NewStockCocinaCentralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStockCocinaCentralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewStockCocinaCentralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
