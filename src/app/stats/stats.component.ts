import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import { Common } from '../common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [NavbarComponent, CommonModule, NgChartsModule, FormsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {

  // Datos originales
  pedidosOriginales: any[] = [];
  descartesOriginales: any[] = [];

  // Filtros de fechas
  fechaPedidosDesde: string = '';
  fechaPedidosHasta: string = '';
  fechaDescartesDesde: string = '';
  fechaDescartesHasta: string = '';

  // Gráficos
  datosProductosMasPedidos: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  datosLocales: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  datosProductosMasDescartados: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  datosLocalesDescartes: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

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
    // Cargar pedidos
    this.http.get<any[]>(`${Common.url}/orders`).subscribe({
      next: (data) => {
        this.pedidosOriginales = data.filter(o => o.active === true);
        console.log('Pedidos cargados:', this.pedidosOriginales); // <-- log de depuración
        this.filtrarPedidos();
      },
      error: (err) => {
        console.error('Error al obtener pedidos:', err);
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });

    // Cargar descartes
    this.http.get<any[]>(`${Common.url}/discarded`).subscribe({
      next: (data) => {
        this.descartesOriginales = data.filter(d => d.active === true);
        console.log('Descartes cargados:', this.descartesOriginales); // <-- log de depuración
        this.filtrarDescartes();
      },
      error: (err) => {
        console.error('Error al obtener descartes:', err);
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  filtrarPedidos() {
    let filtrados = this.pedidosOriginales;

    if (this.fechaPedidosDesde) {
      const desde = new Date(this.fechaPedidosDesde);
      filtrados = filtrados.filter(p => new Date(p.date) >= desde);
    }

    if (this.fechaPedidosHasta) {
      const hasta = new Date(this.fechaPedidosHasta);
      filtrados = filtrados.filter(p => new Date(p.date) <= hasta);
    }
    this.procesarDatosPedidos(filtrados);
  }


  filtrarDescartes() {
    let filtrados = this.descartesOriginales;
    if (this.fechaDescartesDesde) filtrados = filtrados.filter(d => new Date(d.disposalDate) >= new Date(this.fechaDescartesDesde));
    if (this.fechaDescartesHasta) filtrados = filtrados.filter(d => new Date(d.disposalDate) <= new Date(this.fechaDescartesHasta));
    this.procesarDatosDescartes(filtrados);
  }

  // -------------------
  // Pedidos
  // -------------------
  procesarDatosPedidos(orders: any[]) {
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
        if (!productoPorLocal[nombre]) productoPorLocal[nombre] = {};
        productoPorLocal[nombre][local] = (productoPorLocal[nombre][local] || 0) + cantidad;
      }
    }

    const productos = Array.from(productosSet).slice(0, 5);
    const locales = Array.from(localesSet);

    this.datosProductosMasPedidos = {
      labels: productos,
      datasets: locales.map(local => ({
        label: local,
        data: productos.map(p => productoPorLocal[p]?.[local] || 0),
        backgroundColor: this.getColorForLocal(local)
      }))
    };

    // Locales con más pedidos
    const pedidosPorLocal: { [local: string]: number } = {};
    for (const order of orders) {
      const local = order.local;
      pedidosPorLocal[local] = (pedidosPorLocal[local] || 0) + 1;
    }

    const localesOrdenados = Object.entries(pedidosPorLocal).sort((a, b) => b[1] - a[1]).slice(0, 5);
    this.datosLocales = {
      labels: localesOrdenados.map(([local]) => local),
      datasets: [{
        label: 'Pedidos realizados',
        data: localesOrdenados.map(([, cantidad]) => cantidad),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 1
      }]
    };
  }

  // -------------------
  // Descartes
  // -------------------
  procesarDatosDescartes(descartes: any[]) {
    const productoPorLocal: { [producto: string]: { [local: string]: number } } = {};
    const localesSet = new Set<string>();
    const productosSet = new Set<string>();

    for (const descarte of descartes) {
      const local = descarte.local.name;
      localesSet.add(local);

      for (const producto of descarte.products) {
        const nombre = producto.product.name;
        const cantidad = producto.quantity;
        productosSet.add(nombre);
        if (!productoPorLocal[nombre]) productoPorLocal[nombre] = {};
        productoPorLocal[nombre][local] = (productoPorLocal[nombre][local] || 0) + cantidad;
      }
    }

    const productos = Array.from(productosSet).slice(0, 5);
    const locales = Array.from(localesSet);

    // Productos más descartados
    this.datosProductosMasDescartados = {
      labels: productos,
      datasets: locales.map(local => ({
        label: local,
        data: productos.map(p => productoPorLocal[p]?.[local] || 0),
        backgroundColor: this.getColorForLocal(local)
      }))
    };

    // Locales con más descartes
    const descartesPorLocal: { [local: string]: number } = {};
    for (const descarte of descartes) {
      const local = descarte.local.name;
      descartesPorLocal[local] = (descartesPorLocal[local] || 0) + 1;
    }

    const localesOrdenados = Object.entries(descartesPorLocal).sort((a, b) => b[1] - a[1]).slice(0, 5);
    this.datosLocalesDescartes = {
      labels: localesOrdenados.map(([local]) => local),
      datasets: [{
        label: 'Descarte realizados',
        data: localesOrdenados.map(([, cantidad]) => cantidad),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 1
      }]
    };
  }

  getColorForLocal(local: string): string {
    const colores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#8BC34A', '#E91E63', '#03A9F4'];
    const hash = Array.from(local).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colores[hash % colores.length];
  }
}
