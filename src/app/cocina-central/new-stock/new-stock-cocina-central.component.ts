import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CocinaCentralService, Product } from '../cocina-central.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './new-stock.component.html',
  styleUrls: ['./new-stock.component.css']
})
export class NewStockCocinaCentralComponent implements OnInit {

  form!: FormGroup;
  products: Product[] = [];
  loading = false;
  error: string | null = null;
  maxDate = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private cocinaService: CocinaCentralService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  /** Inicializa el formulario principal */
  private initForm(): void {
    this.form = this.fb.group({
      local: ['Cocina Central', Validators.required],
      products: this.fb.array([])
    });
  }

  /** Carga productos activos desde el backend */
  private loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.cocinaService.getProductsList().subscribe({
      next: (products) => {
        this.products = products;
        this.populateProductsArray();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error cargando productos';
        this.loading = false;
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  /** Rellena el formArray con los productos */
  private populateProductsArray(): void {
    const productsArray = this.form.get('products') as FormArray;
    productsArray.clear();

    this.products.forEach((product) => {
      productsArray.push(this.fb.group({
        productId: [product.id],
        productName: [product.name],
        entries: this.fb.array([this.createEntryGroup()])
      }));
    });
  }

  /** Crea un grupo de entrada para cantidad y fecha */
  private createEntryGroup(): FormGroup {
    return this.fb.group({
      quantity: [0, [Validators.required, Validators.min(0)]],
      date: [this.maxDate, Validators.required]
    });
  }

  /** Devuelve el FormArray de productos */
  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  /** Devuelve el FormArray de entradas (fechas+cantidades) de un producto */
  getEntries(productIndex: number): FormArray {
    return this.productsArray.at(productIndex).get('entries') as FormArray;
  }

  /** Añade una nueva entrada de fecha/cantidad a un producto */
  addEntry(productIndex: number): void {
    this.getEntries(productIndex).push(this.createEntryGroup());
  }

  /** Elimina una entrada concreta de un producto */
  removeEntry(productIndex: number, entryIndex: number): void {
    this.getEntries(productIndex).removeAt(entryIndex);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // Recorremos productos y entradas para ver qué falla
      const productsArray = this.form.get('products');
      if (productsArray instanceof FormArray) {
        productsArray.controls.forEach((productGroup, i) => {
          console.log(`Producto [${i}] ->`, productGroup.value);
          console.log(`Errores producto [${i}] ->`, productGroup.errors);

          const entriesArray = (productGroup.get('entries') as FormArray);
          entriesArray.controls.forEach((entryGroup, j) => {
            console.log(`   Entrada [${j}] ->`, entryGroup.value);
            console.log(`   Errores entrada [${j}] ->`, entryGroup.errors);
          });
        });
      }

      this.form.markAllAsTouched();
      return;
    }

    const rawData = this.form.value;

    // Transformar a la estructura del DTO que espera el backend
    const payload = {
      localName: 'Cocina Central',
      products: rawData.products.flatMap((product: any) =>
        product.entries.map((entry: any) => ({
          productId: product.productId,
          productName: product.productName,
          quantity: entry.quantity,
          date: entry.date
        }))
      )
    };

    console.log('✅ Payload a enviar:', payload);

    this.cocinaService.saveStock(payload).subscribe({
      next: () => {
        console.log('Stock creado correctamente');
        alert('Stock guardado correctamente');
        this.form.reset();
        this.populateProductsArray();
        this.router.navigate(['/cocina-central/stock'])
      },
      error: (err) => {
        console.error('Error al crear el stock', err);
        alert('Error al guardar el stock');
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }


}
