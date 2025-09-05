import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://192.168.1.20:8080/safra-stock/orders';
  private localesUrl = 'http://192.168.1.20:8080/safra-stock/locales';

  constructor(private http: HttpClient) { }

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

}
