import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { DiscardedProductsService, DiscardedProduct } from './discarded-products-service';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-discarded-products',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxPaginationModule, FormsModule],
  templateUrl: './discarded-products.component.html',
  styleUrls: ['./discarded-products.component.css']
})
export class DiscardedProductsComponent implements OnInit {

  filterStatus: 'active' | 'inactive' | 'all' = 'active';

  discardedProducts: DiscardedProduct[] = [];
  loading = true;
  error: string | null = null;
  page: number = 1;

  get filteredDiscarded() {
    if (this.filterStatus === 'active') return this.discardedProducts.filter(d => d.active);
    if (this.filterStatus === 'inactive') return this.discardedProducts.filter(d => !d.active);
    return this.discardedProducts;
  }

  constructor(private discardedService: DiscardedProductsService, private router: Router, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    console.log("Cargando productos descartados...");
    this.discardedService.getAll().subscribe({
      next: (data) => {
        this.discardedProducts = data;
        console.log("Productos descartados cargados:", this.discardedProducts);
        this.loading = false;
        if (this.discardedProducts.length === 0) {
          this.error = 'No hay productos descartados registrados';
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los productos descartados';
        console.error("Error al cargar productos descartados:", err);
        this.loading = false;
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }


  crearNuevoRegistro() {
    this.router.navigate(['/desperdicios/nuevo']);
  }

  editarDescarte(discard: DiscardedProduct) {
    this.router.navigate(['/desperdicios/editar', discard.id])
  }

  desactivarDescarte(id: number) {
    if (!confirm('¿Deseas desactivar este descarte?')) return;

    this.discardedService.setActiveDescarte(id, false).subscribe({
      next: () => {
        this.discardedProducts = this.discardedProducts.map(d =>
          d.id === id ? { ...d, active: false } : d
        );
        this.cd.detectChanges();
        alert('Descarte desactivado correctamente');
      },
      error: (err) => {
        console.error('Error al desactivar descarte', err);
        alert('Ocurrió un error al desactivar el descarte');
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  activarDescarte(id: number) {
    this.discardedService.setActiveDescarte(id, true).subscribe({
      next: () => {
        this.discardedProducts = this.discardedProducts.map(d =>
          d.id === id ? { ...d, active: true } : d
        );
        this.cd.detectChanges();
        alert('Descarte reactivado correctamente');
      },
      error: (err) => {
        console.error('Error al reactivar descarte', err);
        alert('Ocurrió un error al reactivar el descarte');
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

}
