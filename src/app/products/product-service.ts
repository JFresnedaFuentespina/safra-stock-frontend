import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Common } from '../common';

export interface Product {
    id: number;
    name: string;
    description: string;
    image: any;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = Common.url +'/products';

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl, { headers: this.getAuthHeaders() });
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    updateProduct(id: number, product: Product): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product, { headers: this.getAuthHeaders() });
    }

    deleteProduct(id: number) {
        return this.http.put(`${this.apiUrl}/disable/${id}`, null, {
            headers: this.getAuthHeaders(),
            responseType: 'text'
        });
    }

    enableProduct(id: number) {
        return this.http.put(`${this.apiUrl}/enable/${id}`, null, {
            headers: this.getAuthHeaders(),
            responseType: 'text'
        });
    }
}
