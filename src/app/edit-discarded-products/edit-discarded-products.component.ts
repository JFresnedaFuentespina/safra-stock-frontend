import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Common } from '../common';
import { DiscardedProductsService } from '../discarded-products/discarded-products-service';

@Component({
  selector: 'app-edit-discarded-products',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-discarded-products.component.html',
  styleUrl: './edit-discarded-products.component.css'
})
export class EditDiscardedProductsComponent implements OnInit {

  form!: FormGroup;
  locales: any[] = [];
  productosDisponibles: any[] = [];
  error: string | null = null;
  id!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private discardedService: DiscardedProductsService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      localId: ['', Validators.required],
      disposalDate: ['', Validators.required],
      reason: ['', Validators.required],
      products: this.fb.array([])
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarLocales();
    this.cargarProductosDisponibles();
    this.cargarDescarte(this.id);
  }

  get products(): FormArray {
    return this.form.get('products') as FormArray;
  }

  cargarLocales() {
    this.http.get<any[]>(`${Common.url}/locales`).subscribe({
      next: (data) => this.locales = data,
      error: (err) => {
        this.error = 'Error al cargar locales';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  cargarProductosDisponibles() {
    this.http.get<any[]>(`${Common.url}/products`).subscribe({
      next: (data) => this.productosDisponibles = data.filter(p => p.active === true),
      error: (err) => {
        console.error('Error al cargar productos', err);
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  cargarDescarte(id: number) {
    this.discardedService.getById(id).subscribe({
      next: (data) => {
        this.form.patchValue({
          localId: data.local.id,
          disposalDate: data.disposalDate,
          reason: data.reason
        });

        this.products.clear();

        // Añadimos los productos que ya tenía el descarte
        data.products.forEach((p: any) => {
          this.products.push(this.fb.group({
            productId: [p.product.id],
            productName: [p.product.name],
            quantity: [p.quantity, [Validators.required, Validators.min(0)]]
          }));
        });
      },
      error: (err) => {
        this.error = 'Error al cargar descarte';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  /** Filtra productos disponibles para que no aparezcan los ya añadidos */
  productosDisponiblesFiltrados() {
    const idsAñadidos = this.products.controls.map(c => c.value.productId);
    return this.productosDisponibles.filter(p => !idsAñadidos.includes(p.id));
  }

  /** Añadir producto usando solo el ID */
  addProductById(productId: number | string) {
    const idNum = Number(productId);
    const producto = this.productosDisponibles.find(p => p.id === idNum);
    if (!producto) return;

    const exists = this.products.controls.some(ctrl => ctrl.value.productId === idNum);
    if (!exists) {
      this.products.push(this.fb.group({
        productId: [producto.id],
        productName: [producto.name],
        quantity: [0, [Validators.required, Validators.min(0)]]
      }));
    }
  }

  /** Eliminar un producto del FormArray */
  removeProduct(index: number) {
    this.products.removeAt(index);
  }

  guardarDescarte() {
    if (this.form.invalid) {
      this.error = 'Por favor, complete todos los campos obligatorios';
      return;
    }

    const dto = {
      reason: this.form.value.reason,
      disposalDate: this.form.value.disposalDate,
      localId: this.form.value.localId,
      active: true,
      products: this.form.value.products.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity
      }))
    };

    this.discardedService.editDiscard(this.id, dto).subscribe({
      next: (res) => {
        alert(res || 'Descarte actualizado correctamente');
        this.router.navigate(['/desperdicios']);
      },
      error: (err) => {
        console.error('Error al actualizar descarte', err);
        this.error = 'Error al actualizar el descarte';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }
}
