import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDiscardedProductComponent } from './new-discarded-product.component';

describe('NewDiscardedProductComponent', () => {
  let component: NewDiscardedProductComponent;
  let fixture: ComponentFixture<NewDiscardedProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDiscardedProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDiscardedProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
