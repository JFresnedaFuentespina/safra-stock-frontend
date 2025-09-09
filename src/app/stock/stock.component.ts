import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { Common } from '../common';

interface LocalStockFlat {
  productName: string;
  localName: string;
  stock: number;
  date: string;
}

interface GroupedStock {
  localName: string;
  products: {
    productName: string;
    stock: number;
    date: string;
  }[];
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})

export class StockComponent implements OnInit {

  stockList: GroupedStock[] = [];
  error = '';
  expanded: Set<string> = new Set(); // Control colapsado por localName

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.http.get<LocalStockFlat[]>(`${Common.url}/stock`).subscribe({
      next: (data) => {
        this.stockList = this.groupByLocal(data);
        console.log(this.stockList);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar el stock';
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onNewStock(): void {
    this.router.navigate(['/stock/nuevo']);
  }

  makeIdFromLocal(localName: string): string {
    return 'collapse_' + localName.toLowerCase().replace(/\s+/g, '_');
  }


  groupByLocal(data: LocalStockFlat[]): GroupedStock[] {
    const grouped: { [key: string]: GroupedStock } = {};

    data.forEach(entry => {
      if (!grouped[entry.localName]) {
        grouped[entry.localName] = {
          localName: entry.localName,
          products: []
        };
      }
      grouped[entry.localName].products.push({
        productName: entry.productName,
        stock: entry.stock,
        date: entry.date
      });
    });

    // Ordenar los productos alfabéticamente por productName dentro de cada local
    Object.values(grouped).forEach(group => {
      group.products.sort((a, b) => a.productName.localeCompare(b.productName));
    });

    return Object.values(grouped);
  }


  toggleCollapse(local: string): void {
    if (this.expanded.has(local)) {
      this.expanded.delete(local);
    } else {
      this.expanded.add(local);
    }
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const dateObj = new Date(fecha);
      return dateObj.toLocaleDateString('es-ES', { weekday: 'long' })
        .replace(/^\w/, c => c.toUpperCase());
    } catch (e) {
      console.error('Error al formatear fecha:', fecha, e);
      return '—';
    }
  }

  editarStock(local: string): void {
    this.router.navigate(['/stock/editar', local]);
  }
}