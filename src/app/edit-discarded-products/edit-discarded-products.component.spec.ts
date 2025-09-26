import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDiscardedProductsComponent } from './edit-discarded-products.component';

describe('EditDiscardedProductsComponent', () => {
  let component: EditDiscardedProductsComponent;
  let fixture: ComponentFixture<EditDiscardedProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDiscardedProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDiscardedProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
