import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStockCCComponent } from './edit-stock-cc.component';

describe('EditStockCCComponent', () => {
  let component: EditStockCCComponent;
  let fixture: ComponentFixture<EditStockCCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStockCCComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditStockCCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
