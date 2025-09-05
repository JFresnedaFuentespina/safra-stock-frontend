import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [NavbarComponent, CommonModule, NgChartsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {
  orders: any[] = [];

  productosLabels: string[] = [];
  productosData: number[] = [];

  localesLabels: string[] = [];
  localesData: number[] = [];

  groupedData: { [local: string]: { [product: string]: number } } = {};
  groupedChartLabels: string[] = [];
  groupedChartDatasets: any[] = [];

  datosProductosMasPedidos: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  datosLocales: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: []
  };

  datosRadarPorLocal: ChartConfiguration<'radar'>['data'] = {
    labels: [],
    datasets: []
  };

  opcionesGrafico: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: '' }
    }
  };



  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.http.get<any[]>('http://192.168.1.20:8080/safra-stock/orders').subscribe({
      next: (data) => {
        this.orders = data;
        this.procesarDatos(this.orders);
      },
      error: (err) => {
        console.error('Error al obtener pedidos:', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  procesarDatos(orders: any[]): void {
    const productoPorLocal: { [producto: string]: { [local: string]: number } } = {};
    const localesSet = new Set<string>();
    const productosSet = new Set<string>();

    for (const order of orders) {
      const local = order.local;
      const productos = Array.isArray(order.products) ? order.products : [];

      localesSet.add(local);

      for (const producto of productos) {
        const nombre = producto.productName;
        const cantidad = producto.quantity;

        productosSet.add(nombre);

        if (!productoPorLocal[nombre]) {
          productoPorLocal[nombre] = {};
        }

        productoPorLocal[nombre][local] = (productoPorLocal[nombre][local] || 0) + cantidad;
      }
    }

    const productos = Array.from(productosSet).slice(0, 5);
    const locales = Array.from(localesSet);

    // Preparar datasets: un dataset por local
    const datasets = locales.map(local => {
      return {
        label: local,
        data: productos.map(producto => productoPorLocal[producto]?.[local] || 0),
        backgroundColor: this.getColorForLocal(local)
      };
    });

    this.datosProductosMasPedidos = {
      labels: productos,
      datasets: datasets
    };

    // Locales más activos por número de pedidos (no productos)
    const pedidosPorLocal: { [local: string]: number } = {};
    for (const order of orders) {
      const local = order.local;
      pedidosPorLocal[local] = (pedidosPorLocal[local] || 0) + 1;
    }

    const localesOrdenados = Object.entries(pedidosPorLocal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.datosLocales = {
      labels: localesOrdenados.map(([local]) => local),
      datasets: [
        {
          label: 'Pedidos realizados',
          data: localesOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderWidth: 1,
        },
      ],
    };
  }

  getColorForLocal(local: string): string {
    const colores = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#C9CBCF', '#8BC34A', '#E91E63', '#03A9F4'
    ];
    const hash = Array.from(local).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colores[hash % colores.length];
  }

  generarDatasetAgrupado(): void {
    const productos = new Set<string>();
    const locales = Object.keys(this.groupedData);
    for (const local of locales) {
      for (const prod of Object.keys(this.groupedData[local])) {
        productos.add(prod);
      }
    }

    this.groupedChartLabels = Array.from(productos);
    this.groupedChartDatasets = locales.map(local => {
      return {
        label: local,
        data: this.groupedChartLabels.map(prod => this.groupedData[local][prod] || 0)
      };
    });
  }

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true
  };
}
