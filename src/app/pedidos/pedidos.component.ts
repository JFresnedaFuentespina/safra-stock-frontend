import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { Pedido, PedidoService } from './pedidos-service';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


interface StockProduct {
  productName: string;
  stock: number;
  productDate: Date;
}


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

  sentProducts: { productName: string; quantity: number }[] = [];
  pendingProducts: { productName: string; quantity: number }[] = [];


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
    if (!pedido) return;

    // Inicializar selectedPedido con originalQuantity
    this.selectedPedido = {
      ...pedido,
      products: pedido.products.map(p => ({
        ...p,
        originalQuantity: p.quantity,
        quantity: 0 // cantidad a enviar ahora
      }))
    };

    // Traemos stock y envíos en paralelo
    this.stockCocinaCentral = null; // para que aparezca spinner mientras carga

    // GET stock de Cocina Central
    this.pedidoService.getLastStockCocinaCentral().subscribe({
      next: (stockData) => {
        this.stockCocinaCentral = stockData;

        // Una vez que tenemos el stock, traemos envíos
        this.pedidoService.getOrderShipments(pedido.orderId).subscribe({
          next: (shipments) => {
            this.sentProducts = shipments;

            // Añadir sent y pending a selectedPedido.products
            this.selectedPedido!.products = this.selectedPedido!.products.map(p => {
              const sentQty = this.sentProducts
                .filter(s => s.productName.trim().toLowerCase() === p.productName.trim().toLowerCase())
                .reduce((sum, s) => sum + Number(s.quantity), 0);

              return {
                ...p,
                sent: sentQty,
                pending: Math.max(0, (p.originalQuantity ?? 0) - sentQty),
                quantity: 0
              };
            });

            // Solo ahora abrimos el modal
            this.showModal = true;
          },
          error: (err) => {
            console.error('Error al cargar envíos:', err);
            this.selectedPedido!.products = this.selectedPedido!.products.map(p => ({
              ...p,
              sent: 0,
              pending: p.originalQuantity ?? 0,
              quantity: 0
            }));
            this.showModal = true;
          }
        });

      },
      error: (err) => {
        console.error('Error al cargar stock de Cocina Central:', err);
        this.stockCocinaCentral = null;
        this.showModal = true; // abrimos el modal aunque no haya stock
      }
    });
  }



  // Cierra el modal
  closeModal(): void {
    this.showModal = false;
    this.selectedPedido = null;
    this.stockCocinaCentral = null;
  }


  confirmSendOrder(): void {
    if (!this.selectedPedido) return;

    const payload = this.selectedPedido.products
      .filter(p => Number(p.quantity) > 0)
      .map(p => ({
        productName: p.productName,
        quantity: Number(p.quantity),
        orderId: this.selectedPedido!.orderId
      }));

    if (payload.length === 0) {
      alert('No has indicado ninguna cantidad a enviar');
      return;
    }

    this.updateTodaysCocinaCentralStock(payload);
  }

  getStockForProduct(productName: string): number {
    if (!this.stockCocinaCentral) return 0;

    const stockItem = this.stockCocinaCentral.products.find((s: StockProduct) =>
      s.productName.trim().toLowerCase() === productName.trim().toLowerCase()
    );

    return stockItem?.stock ?? 0;
  }


  updateTodaysCocinaCentralStock(payload: {
    productName: string;
    quantity: number;
    orderId: number;
  }[]): void {

    if (!this.selectedPedido) return;

    if (!this.stockCocinaCentral) {
      alert('No hay stock de Cocina Central cargado');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stockDate = new Date(this.stockCocinaCentral.date);
    stockDate.setHours(0, 0, 0, 0);

    // Añadimos la fecha del stock a cada producto
    const finalPayload = payload.map(p => ({
      productName: p.productName,
      quantity: p.quantity,
      orderId: p.orderId,
      date: this.stockCocinaCentral.date
    }));

    const request$ =
      stockDate.getTime() === today.getTime()
        ? this.pedidoService.updateCocinaCentralStock(finalPayload)
        : this.pedidoService.generateCocinaCentralStockFromLast(finalPayload);

    request$.subscribe({
      next: () => {
        alert(
          stockDate.getTime() === today.getTime()
            ? 'Stock de Cocina Central actualizado correctamente'
            : 'Nuevo stock de Cocina Central generado correctamente'
        );
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar/generar el stock de Cocina Central');
      }
    });
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
