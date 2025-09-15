import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Common } from '../common';
import { Router } from '@angular/router';

export interface ProductQuantity {
  productName: string;
  quantity: number;
}

export interface Pedido {
  orderId: number;
  local: string;
  products: ProductQuantity[];
  date: Date;
  active: boolean | number;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = Common.url + '/orders';
  private localesUrl = Common.url + '/locales';

  constructor(private http: HttpClient, private router: Router) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getOrders(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getOrderById(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  newOrder(newPedido: { local: string; products: ProductQuantity[] }): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, newPedido, { headers: this.getAuthHeaders() });
  }

  updateOrder(updatedPedido: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${updatedPedido.orderId}`, updatedPedido, { headers: this.getAuthHeaders() });
  }

  getLocales(): Observable<{ name: string }[]> {
    return this.http.get<{ name: string }[]>(this.localesUrl, { headers: this.getAuthHeaders() });
  }
  disableOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/disable/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  enableOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/enable/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  generarPedidoAutomatico(localName: string, productos: { productName: string, quantity: number }[]): void {
    console.log('Generando pedido automático', localName, productos); // <-- aquí
    const payload = { local: localName, products: productos };
    this.http.post(`${Common.url}/orders`, payload, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        alert(`Pedido automático generado para completar mínimos en ${localName}`);
      },
      error: (err) => {
        console.error('Error al enviar el pedido', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }


  sendEmailPedido(localName: string, productos: { productName: string, quantity: number }[]): void {
    const payload = {
      localName,
      message: 'Se ha generado un nuevo pedido para ' + localName,
      products: productos
    };

    this.http.post(`${Common.url}/orders/send-order-notification`, payload, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        alert('Correo enviado a los trabajadores del local');
      },
      error: (err) => {
        console.error('Error al enviar correo', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }


}
