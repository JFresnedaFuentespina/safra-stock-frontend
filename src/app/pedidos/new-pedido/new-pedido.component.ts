import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../navbar/navbar.component';
import { ProductService, Product } from '../../products/product-service';
import { PedidoService } from '../pedidos-service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Local {
  name: string
}

export interface SimpleUser {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-new-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './new-pedido.component.html',
  styleUrls: ['./new-pedido.component.css'],
})


export class NewPedidoComponent implements OnInit {
  form!: FormGroup;
  products: Product[] = [];
  loading = true;
  error = '';
  locales: Local[] = [];
  private apiUrl = 'http://192.168.1.20:8080/safra-stock';


  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private pedidoService: PedidoService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // crea formulario
    this.form = this.fb.group({
      local: ['', Validators.required],
      products: this.fb.array([]),
    });

    // carga productos
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.buildProductsControls();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la lista de productos.';
        this.loading = false;
      },
    });
    const token = localStorage.getItem('authToken');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    // carga locales
    this.http.get<Local[]>('http://192.168.1.20:8080/safra-stock/locales', { headers }).subscribe({
      next: (data) => {
        this.locales = data;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la lista de locales.';
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      },
    });
  }


  /** Crea un formControl(quantity) por cada producto */
  private buildProductsControls(): void {
    this.products.forEach((p) =>
      this.productsArray.push(
        this.fb.group({
          productName: [p.name],
          quantity: [0, [Validators.min(0)]],
        })
      )
    );
  }

  /** Enviar nuevo pedido */
  onSubmit(): void {
    if (this.form.invalid) return;

    // filtra productos con cantidad > 0
    const productosSeleccionados = this.productsArray.value
      .filter((p: any) => p.quantity > 0)
      .map((p: any) => ({
        productName: p.productName,
        quantity: p.quantity,
      }));

    if (!productosSeleccionados.length) {
      this.error = 'Debes seleccionar al menos un producto con cantidad mayor que cero.';
      return;
    }

    const payload = {
      local: this.form.value.local,
      products: productosSeleccionados,
    };

    this.pedidoService.newOrder(payload).subscribe({
      next: () => this.router.navigate(['/pedidos']), // vuelve a la lista
      error: (err) => {
        console.error(err);
        this.error = 'Error al guardar el pedido.';
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      },
    });
    this.sendEmailPedido();
  }


  getUsersInLocal(localName: string): Observable<SimpleUser[]> {
    const params = new HttpParams().set('localName', localName);
    return this.http.get<SimpleUser[]>(`${this.apiUrl}/users/get-users-in-local`, { params });
  }

  sendEmailPedido(): void {
    // Filtrar productos con cantidad > 0 (igual que al crear el pedido)
    const productosSeleccionados = this.productsArray.value
      .filter((p: any) => p.quantity > 0)
      .map((p: any) => ({
        productName: p.productName,
        quantity: p.quantity
      }));


    const payload = {
      localName: this.form.value.local,  // nombre del local
      message: 'Se ha generado un nuevo pedido para ' + this.form.value.local,
      products: productosSeleccionados   // <-- aquí agregamos los productos
    };

    this.http.post(`${this.apiUrl}/orders/send-order-notification`, payload).subscribe({
      next: () => {
        alert('Correo enviado a los trabajadores del local');
      },
      error: (err) => {
        console.error('Error al enviar correo', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

}
