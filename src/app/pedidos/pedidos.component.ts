import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { Pedido, PedidoService } from './pedidos-service';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, NavbarComponent, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent {
  pedidos: Pedido[] = [];
  loading = true;
  error = '';
  page: number = 1;

  isCocinaCentral = false;
  selectedPedido: Pedido | null = null;
  showModal = false;
  stockCocinaCentral: any = null;
  selectedStockItems: any[] = [];


  constructor(private pedidoService: PedidoService, private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.pedidoService.getLocalesForUser().subscribe({
      next: (locales) => {
        console.log('Locales del usuario:', locales);

        // ✅ Comprobar si alguno es “Cocina Central”
        this.isCocinaCentral = locales.some(l => l.name === 'Cocina Central');

        this.pedidoService.getOrders().subscribe({
          next: (data) => {
            this.pedidos = data.sort((a, b) => b.orderId - a.orderId);
            this.loading = false;
          },
          error: (err) => {
            this.error = 'No se pudieron cargar los pedidos';
            console.error(err);
            this.loading = false;
            if (err.status === 401 || err.status === 403) {
              this.router.navigate(['/login']);
            }
          },
        });
      },
      error: (err) => {
        console.error('Error al obtener locales del usuario', err);
        this.error = 'No se pudieron obtener los locales del usuario';
        this.loading = false;
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  showDisabled = false;
  filterStatus: 'active' | 'inactive' | 'all' = 'active';

  get filteredPedidos() {
    if (this.filterStatus === 'active') {
      return this.pedidos.filter(p => p.active);
    } else if (this.filterStatus === 'inactive') {
      return this.pedidos.filter(p => !p.active);
    } else {
      return this.pedidos;
    }
  }

  onNewOrder(): void {
    this.router.navigate(['/pedidos/nuevo']);
  }

  onEditOrder(id: number): void {
    this.router.navigate(['/pedidos/editar', id]);
  }

  onDeleteOrder(id: number): void {
    if (confirm('¿Seguro que quieres desactivar este pedido?')) {
      this.pedidoService.disableOrder(id).subscribe({
        next: () => {
          this.pedidos = this.pedidos.map(p =>
            p.orderId === id ? { ...p, active: false } : p
          );
        },
        error: (err) => {
          console.error('Error al desactivar pedido', err);
          this.error = 'No se pudo desactivar el pedido';
          if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
        }
      });
    }
  }

  onEnableOrder(id: number): void {
    this.pedidoService.enableOrder(id).subscribe({
      next: () => {
        const pedido = this.pedidos.find(p => p.orderId === id);
        if (pedido) pedido.active = true;
      },
      error: (err) => {
        console.error('Error al reactivar pedido', err);
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  onSendOrder(id: number): void {
    const pedido = this.pedidos.find(p => p.orderId === id);
    if (pedido) {
      this.selectedPedido = pedido;
      this.showModal = true;

      // 🔹 Cargar el stock de Cocina Central desde el backend
      this.pedidoService.getLastStockCocinaCentral().subscribe({
        next: (stockData) => {
          console.log('Stock Cocina Central:', stockData);
          this.stockCocinaCentral = stockData;
        },
        error: (err) => {
          console.error('Error al obtener stock de Cocina Central', err);
          this.stockCocinaCentral = null;
          if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
        }
      });
    }
  }

  // Cierra el modal
  closeModal(): void {
    this.showModal = false;
    this.selectedPedido = null;
    this.stockCocinaCentral = null;
  }


  confirmSendOrder(): void {
    if (!this.selectedPedido) return;

    if (this.selectedStockItems.length === 0) {
      alert('No hay productos seleccionados.');
      return;
    }

    this.updateTodaysCocinaCentralStock(this.selectedStockItems);
  }

  updateTodaysCocinaCentralStock(selectedStocks: any[]): void {
    const pedido = this.selectedPedido;
    if (!pedido) return;

    if (!this.stockCocinaCentral) {
      alert('No hay stock de Cocina Central cargado');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stockDate = new Date(this.stockCocinaCentral.date);
    stockDate.setHours(0, 0, 0, 0);

    const payload = pedido.products.map(p => {
      const selected = selectedStocks.find(s => s.productName === p.productName);
      if (!selected) return null;

      return {
        productName: p.productName,
        quantity: p.quantity,
        date: selected.productDate ? selected.productDate.slice(0, 10) : null,
        orderId: pedido.orderId
      };
    }).filter(p => p !== null) as any[];

    console.log("Payload final enviado al backend:", payload);

    const request$ = stockDate.getTime() === today.getTime()
      ? this.pedidoService.updateCocinaCentralStock(payload)
      : this.pedidoService.generateCocinaCentralStockFromLast(payload);

    request$.subscribe({
      next: () => {
        alert(stockDate.getTime() === today.getTime()
          ? 'Stock de Cocina Central actualizado correctamente'
          : 'Nuevo stock de Cocina Central generado correctamente');
        this.selectedStockItems = [];
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar/generar el stock de Cocina Central');
      }
    });
  }


  toggleStockSelection(stockItem: any) {
    const index = this.selectedStockItems.findIndex(p => p.productName === stockItem.productName);
    if (index === -1) {
      this.selectedStockItems.push(stockItem);
    } else {
      this.selectedStockItems.splice(index, 1);
    }
  }

  isStockSelected(stockItem: any): boolean {
    return this.selectedStockItems.some(p => p.productName === stockItem.productName);
  }



  formatFecha(date: string | null | undefined): string {
    if (!date) return 'Fecha no disponible';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
