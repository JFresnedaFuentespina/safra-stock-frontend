import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { DiscardedProductsService, DiscardedProduct } from './discarded-products-service';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-discarded-products',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxPaginationModule],
  templateUrl: './discarded-products.component.html',
  styleUrls: ['./discarded-products.component.css']
})
export class DiscardedProductsComponent implements OnInit {

  discardedProducts: DiscardedProduct[] = [];
  loading = true;
  error: string | null = null;
  page: number = 1;

  constructor(private discardedService: DiscardedProductsService, private router: Router) { }

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
}
