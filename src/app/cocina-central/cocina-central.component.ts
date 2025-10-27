import { Component, OnInit } from '@angular/core';
import { CocinaCentralService, StockCocinaGrouped } from './cocina-central.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cocina-central',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './cocina-central.component.html',
  styleUrls: ['./cocina-central.component.css']
})
export class CocinaCentralComponent implements OnInit {
  stockList: StockCocinaGrouped[] = [];
  filteredStockList: StockCocinaGrouped[] = [];
  error = '';

  filterStartDate = '';
  filterEndDate = '';

  constructor(private service: CocinaCentralService, private router: Router) { }

  ngOnInit(): void {
    this.service.getStockList().subscribe({
      next: (data) => {
        // Agrupar productos repetidos dentro de cada fecha
        this.stockList = data.map(group => ({
          ...group,
          products: this.combineDuplicateProducts(group.products)
        }));

        console.log(this.stockList);
        this.filteredStockList = [...this.stockList];
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el stock de cocina central';
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }


  applyFilters(): void {
    this.filteredStockList = this.stockList.filter(group => {
      const stockDate = new Date(group.date);
      const startDate = this.filterStartDate ? new Date(this.filterStartDate) : null;
      const endDate = this.filterEndDate ? new Date(this.filterEndDate) : null;

      const matchStart = startDate ? stockDate >= startDate : true;
      const matchEnd = endDate ? stockDate <= endDate : true;

      return matchStart && matchEnd;
    });
  }

  private combineDuplicateProducts(products: any[]): any[] {
    const combined: { [key: string]: any } = {};

    for (const product of products) {
      // ✅ Clave correcta: nombre + fecha del producto
      const key = `${product.productName.trim().toLowerCase()}_${product.productDate}`;

      if (!combined[key]) {
        combined[key] = { ...product };
      } else {
        combined[key].stock += product.stock;
      }
    }

    return Object.values(combined);
  }


  formatFecha(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onNewStock(): void {
    this.router.navigate(['/cocina-central/nuevo']);
  }
}
