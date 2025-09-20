import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscardedProductsComponent } from './discarded-products.component';

describe('DiscardedProductsComponent', () => {
  let component: DiscardedProductsComponent;
  let fixture: ComponentFixture<DiscardedProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscardedProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscardedProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
