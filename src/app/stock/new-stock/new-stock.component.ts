import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ProductService, Product } from '../../products/product-service';
import { Router } from '@angular/router';

export interface Local {
  name: string;
}

@Component({
  selector: 'app-new-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './new-stock.component.html',
  styleUrls: ['./new-stock.component.css']
})
export class NewStockComponent implements OnInit {
  form!: FormGroup;
  products: Product[] = [];
  locales: Local[] = [];
  loading = true;
  error = '';
  maxDate: string = new Date().toISOString().split('T')[0];
  private apiUrl = 'http://192.168.1.35:8080/safra-stock';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private productService: ProductService,
    private router: Router
  ) { }

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      local: ['', Validators.required],
      products: this.fb.array([])
    });

    const token = localStorage.getItem('authToken');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    // Cargar productos
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        console.log('Productos cargados:', this.products.map(p => p.name));
        this.buildProductsControls();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la lista de productos.';
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });

    // Cargar locales
    this.http.get<Local[]>(`${this.apiUrl}/locales`, { headers }).subscribe({
      next: (data) => {
        this.locales = data;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la lista de locales.';
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private buildProductsControls(): void {
    this.productsArray.clear();

    this.products.forEach((p) =>
      this.productsArray.push(
        this.fb.group({
          productName: [p.name],
          entries: this.fb.array([
            this.fb.group({
              quantity: [null, [Validators.required, Validators.min(0)]],
              date: [null, Validators.required]
            })
          ])
        })
      )
    );

    console.log('FormArray products controls creados:', this.productsArray.length);
  }

  getProductsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  getEntries(i: number): FormArray {
    return this.productsArray.at(i).get('entries') as FormArray;
  }

  getEntryControls(productIndex: number) {
    const entries = this.getEntries(productIndex);
    return entries ? entries.controls : [];
  }

  addEntry(productIndex: number): void {
    this.getEntries(productIndex).push(
      this.fb.group({
        quantity: [null, [Validators.required, Validators.min(0)]],
        date: [null, Validators.required]
      })
    );
  }

  removeEntry(productIndex: number, entryIndex: number) {
    const entries = this.getEntries(productIndex);
    if (entries.length > 1) {
      entries.removeAt(entryIndex);
    }
  }


  onSubmit(): void {
    if (this.form.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const localName = this.form.value.local;
    const token = localStorage.getItem('authToken');
    const headers = token
      ? new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
      : undefined;

    const products = this.productsArray.value;
    let hasValidEntry = false;

    for (const product of products) {
      for (const entry of product.entries) {
        if (entry.quantity != null && entry.date != null) {
          hasValidEntry = true;

          const body = {
            productName: product.productName,
            stock: entry.quantity,
            date: this.formatDateToDatetime(entry.date),
            localName: localName
          };

          this.http.post(`${this.apiUrl}/stock`, body, { headers }).subscribe({
            next: () => {
              console.log(`Stock guardado para ${product.productName}`);
            },
            error: (err) => {
              console.error(`Error guardando stock para ${product.productName}:`, err);
              if (err.status === 401 || err.status === 403) {
                this.router.navigate(['/login']);
              }
            }
          });
        }
      }
    }

    if (!hasValidEntry) {
      this.error = 'Debes completar al menos un producto con cantidad y fecha.';
      return;
    }

    alert('Stock guardado correctamente.');
    this.router.navigate(['/stock']);
  }

  private formatDateToDatetime(dateString: string): string {
    return `${dateString}T00:00:00`;
  }
}
