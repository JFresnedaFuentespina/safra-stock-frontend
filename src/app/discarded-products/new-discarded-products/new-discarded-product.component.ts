import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { Common } from '../../common';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
}

interface Local {
  id: number;
  name: string;
}

@Component({
  selector: 'app-new-discarded-product',
  standalone: true,
  imports: [NavbarComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './new-discarded-product.component.html',
  styleUrls: ['./new-discarded-product.component.css']
})
export class NewDiscardedProductComponent implements OnInit {

  form: FormGroup;
  productos: Product[] = [];
  locales: Local[] = [];
  error = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      localId: [null, Validators.required],
      disposalDate: [null, Validators.required],
      reason: ['', Validators.required],
      products: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.cargarLocales();
    this.cargarProductos(); // cargamos productos y generamos FormArray automáticamente
  }

  get products(): FormArray {
    return this.form.get('products') as FormArray;
  }

  // Cargar productos desde backend y generar una tarjeta por cada producto
  cargarProductos() {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Product[]>(`${Common.url}/products`, { headers }).subscribe({
      next: (data) => {
        this.productos = data;
        console.log('Productos cargados:', this.productos);

        // Generamos una tarjeta de producto para cada producto
        this.productos.forEach(p => {
          this.products.push(
            this.fb.group({
              productId: [p.id],
              productName: [p.name],
              quantity: [0, [Validators.required, Validators.min(0)]]
            })
          );
        });
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.error = 'Error al cargar productos';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);

      }
    });
  }

  // Cargar locales desde backend
  cargarLocales() {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Local[]>(`${Common.url}/locales`, { headers }).subscribe({
      next: (data) => {
        this.locales = data;
        console.log('Locales cargados:', this.locales);
      },
      error: (err) => {
        console.error('Error al cargar locales', err);
        this.error = 'Error al cargar locales';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);

      }
    });
  }

  // Guardar descarte, filtrando productos con cantidad > 0
  guardarDescarte() {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedLocal = this.locales.find(l => l.id === +this.form.value.localId);
    if (!selectedLocal) {
      this.error = 'Local seleccionado no válido';
      return;
    }

    const body = {
      localId: this.form.value.localId,
      disposalDate: this.form.value.disposalDate,
      reason: this.form.value.reason,
      products: this.form.value.products
        .filter((p: any) => p.quantity > 0)
        .map((p: any) => ({
          productId: p.productId,
          quantity: p.quantity
        }))
    };

    console.log("guardando... ", body);

    this.http.post(`${Common.url}/discarded`, body, { headers, responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert(res || 'Descarte guardado correctamente');
          this.router.navigate(['/desperdicios']);
        },
        error: (err) => {
          console.error('Error al guardar descarte', err);
          this.error = 'Error al guardar el descarte';
        }
      });

  }


}
