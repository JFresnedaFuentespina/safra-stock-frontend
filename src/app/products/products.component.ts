import { Component } from '@angular/core';
import { ProductService } from './product-service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { NgxPaginationModule } from 'ngx-pagination';
import { EditProductComponent } from './edit-product/edit-product.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, NavbarComponent, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})

export class ProductsComponent {

  constructor(private productService: ProductService, private router: Router, private cd: ChangeDetectorRef) { }

  showInactive = false;
  products: any[] = [];
  page: number = 1;

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data.map(product => ({
          ...product,
          imageUrl: product.image ? this.createImageUrlFromBase64(product.image) : null
        }));
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener productos:", err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }
  
  filterStatus: 'active' | 'inactive' | 'all' = 'active';

  get filteredProducts() {
    if (this.filterStatus === 'active') {
      return this.products.filter(p => p.active);
    } else if (this.filterStatus === 'inactive') {
      return this.products.filter(p => !p.active);
    } else {
      return this.products;
    }
  }


  createImageUrlFromBase64(base64String: string): string {
    // Cambia 'image/png' si tus imágenes son otro tipo
    return `data:image/png;base64,${base64String}`;
  }

  onEditProduct(id: number) {
    this.router.navigate(['/products/editar', id]);
  }


  onDeleteProduct(id: number) {
    if (!confirm('¿Estás seguro de que deseas desactivar este producto?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        // No lo quitamos, solo lo marcamos como inactivo
        this.products = this.products.map(p =>
          p.id === id ? { ...p, active: false } : p
        );
        alert('Producto desactivado correctamente');
      },
      error: (err) => {
        console.error('Error al desactivar producto', err);
        if (err.status === 401 || err.status === 403) {
          alert('No tienes permisos para desactivar este producto');
          this.router.navigate(['/login']);
        } else if (err.status === 404) {
          alert('Producto no encontrado');
        } else {
          alert('Ocurrió un error al desactivar el producto');
        }
      }
    });
  }

  onEnableProduct(id: number) {
    this.productService.enableProduct(id).subscribe({
      next: () => {
        this.products = this.products.map(p =>
          p.id === id ? { ...p, active: true } : p
        );
        alert('Producto reactivado correctamente');
      },
      error: (err) => {
        console.error('Error al reactivar producto', err);
        alert('Ocurrió un error al reactivar el producto');
      }
    });
  }

  onNewProduct() {
    this.router.navigate(['/products/nuevo']);
  }

}