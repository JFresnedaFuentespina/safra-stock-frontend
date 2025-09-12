import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { Common } from '../common';
import { ProductStockDate } from './product-stock-date';

interface LocalStockFlat {
  productName: string;
  localName: string;
  stock: number;
  productDate: string;   // fecha del producto
  stockDate: string;     // fecha del pedido (ProductStockDate)
}

interface GroupedStock {
  localName: string;
  products: {
    productName: string;
    stock: number;
    productDate: string;
    orderDate: string;
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
  expanded: Set<string> = new Set();

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<ProductStockDate[]>(`${Common.url}/stock`, { headers }).subscribe({
      next: (data) => {
        const flatData: LocalStockFlat[] = [];

        data.forEach(item => {
          flatData.push({
            localName: item.productStock.localName,
            productName: item.productStock.productName,
            stock: item.productStock.stock,
            productDate: item.productStock.date,   // fecha individual del producto
            stockDate: item.date                    // fecha de registro del pedido
          });
        });

        this.stockList = this.groupByLocal(flatData);
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
        productDate: entry.productDate,
        orderDate: entry.stockDate
      });
    });

    // Ordenar productos alfabéticamente
    Object.values(grouped).forEach(group => {
      group.products.sort((a, b) => a.productName.localeCompare(b.productName));
    });

    return Object.values(grouped);
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const dateObj = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };
      // Convertir a string con formato es-ES y capitalizar primera letra del día
      return dateObj.toLocaleDateString('es-ES', opciones)
        .replace(/^\w/, c => c.toUpperCase());
    } catch (e) {
      console.error('Error al formatear fecha:', fecha, e);
      return '—';
    }
  }


  toggleCollapse(local: string): void {
    if (this.expanded.has(local)) {
      this.expanded.delete(local);
    } else {
      this.expanded.add(local);
    }
  }

  editarStock(local: string): void {
    this.router.navigate(['/stock/editar', local]);
  }
}