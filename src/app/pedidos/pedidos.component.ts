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

  /** ✅ Nuevo: indica si el usuario pertenece a “Cocina Central” */
  isCocinaCentral = false;

  constructor(private pedidoService: PedidoService, private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.pedidoService.getLocalesForUser().subscribe({
      next: (locales) => {
        console.log('Locales del usuario:', locales);

        // ✅ Comprobar si alguno es “Cocina Central”
        this.isCocinaCentral = locales.some(l => l.name === 'Cocina Central');

        this.pedidoService.getOrders().subscribe({
          next: (data) => {
            this.pedidos = data;
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
      }
    });
  }

  /** ✅ Nuevo: acción del botón Enviar */
  onSendOrder(id: number): void {
    console.log('📤 Enviar pedido', id);
    // Aquí podrías hacer un this.pedidoService.sendOrder(id).subscribe(...)
    alert(`Pedido ${id} enviado correctamente (simulado)`);
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
