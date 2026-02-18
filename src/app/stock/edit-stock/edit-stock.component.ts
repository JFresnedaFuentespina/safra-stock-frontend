import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { Common } from '../../common';

interface ProductStockDateResponse {
  id: {
    stockId: number;
    productLocalId: number;
  };
  date: string;
  productStock: {
    id: number;
    productName: string;
    localName: string;
    stock: number;
    date: string;
  };
}

@Component({
  selector: 'app-edit-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './edit-stock.component.html',
  styleUrls: ['./edit-stock.component.css']
})
export class EditStockComponent implements OnInit {

  form!: FormGroup;
  localName!: string;
  stockDate!: string;

  loading = true;
  error = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  ngOnInit(): void {
    this.localName = this.route.snapshot.paramMap.get('localName')!;
    this.stockDate = this.route.snapshot.paramMap.get('date')!;
    console.log('EditStock ngOnInit', this.localName, this.stockDate);
    if (!this.localName || !this.stockDate) {
      this.error = 'Parámetros inválidos.';
      this.loading = false;
      return;
    }

    this.form = this.fb.group({
      products: this.fb.array([])
    });

    this.loadStock();
  }

  private loadStock(): void {

    const token = localStorage.getItem('authToken');
    if (!token) {
      // this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.localName = decodeURIComponent(
      this.route.snapshot.paramMap.get('localName')!
    );

    this.http.get<ProductStockDateResponse[]>(
      `${Common.url}/stock/get-local-stock`,
      {
        headers,
        params: {
          localName: this.localName,
          date: this.stockDate
        }
      }
    ).subscribe({
      next: (data) => {
        this.buildForm(data);
        this.loading = false;
        console.log('Datos recibidos', data);
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el stock.';
        this.loading = false;

        if (err.status === 401 || err.status === 403) {
          // this.router.navigate(['/login']);
        }
      }
    });
  }

  private buildForm(data: ProductStockDateResponse[]): void {
    const productsFormArray = this.productsArray;
    productsFormArray.clear();

    data.forEach(item => {
      productsFormArray.push(
        this.fb.group({
          productId: [item.productStock.id],
          productName: [item.productStock.productName],
          stock: [
            item.productStock.stock,
            [Validators.required, Validators.min(0)]
          ]
        })
      );
    });
  }

  onSubmit(): void {

    if (this.form.invalid) {
      this.error = 'Formulario inválido.';
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      // this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const updatedStock = this.productsArray.value.map((product: any) => ({
      productId: product.productId,
      stock: product.stock,
      localName: this.localName,
      date: `${this.stockDate}T00:00:00`
    }));

    this.http.put(
      `${Common.url}/stock/update-batch`,
      updatedStock,
      { headers }
    ).subscribe({
      next: () => {
        alert('Stock actualizado correctamente.');
        // this.router.navigate(['/stock']);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error actualizando el stock.';
      }
    });
  }
}
