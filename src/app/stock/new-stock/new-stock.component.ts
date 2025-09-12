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
import { Common } from '../../common';

export interface Local {
  name: string;
}

export interface ProductEntry {
  quantity: number | null;
  date: string | null;
}

export interface ProductForm {
  productName: string;
  entries: ProductEntry[];
}

export interface StockPayload {
  productName: string;
  stock: number;
  date: string;
  localName: string;
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
      next: (data: Product[]) => {
        this.products = data;
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
    this.http.get<Local[]>(`${Common.url}/locales`, { headers }).subscribe({
      next: (data: Local[]) => {
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
    this.products.forEach((p: Product) =>
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
  }

  getEntries(i: number): FormArray {
    return this.productsArray.at(i).get('entries') as FormArray;
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
    if (entries.length > 1) entries.removeAt(entryIndex);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const localName = this.form.value.local;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const products: ProductForm[] = this.productsArray.value;
    const payload: StockPayload[] = products.flatMap((product: ProductForm) =>
      product.entries
        .filter((entry: ProductEntry) => entry.quantity != null && entry.date != null)
        .map((entry: ProductEntry) => ({
          productName: product.productName,
          stock: entry.quantity!,
          date: this.formatDateToDatetime(entry.date!),
          localName: localName
        }))
    );

    if (payload.length === 0) {
      this.error = 'Debes completar al menos un producto con cantidad y fecha.';
      return;
    }

    this.http.post(`${Common.url}/stock/batch`, payload, { headers }).subscribe({
      next: () => {
        alert('Stock guardado correctamente.');
        this.router.navigate(['/stock']);
      },
      error: (err) => {
        console.error('Error guardando stock:', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        } else {
          this.error = 'Ocurrió un error guardando el stock.';
        }
      }
    });
  }

  private formatDateToDatetime(dateString: string): string {
    return `${dateString}T00:00:00`;
  }
}
