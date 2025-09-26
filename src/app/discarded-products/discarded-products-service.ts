import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Common } from '../common';

export interface Product {
    id: number;
    name: string;
}

export interface DisposedProduct {
    id: number;
    product: Product;
    quantity: number;
}

export interface Local {
    id: number;
    name: string;
}

export interface DiscardedProduct {
    id: number;
    products: DisposedProduct[];
    reason: string;
    disposalDate: string;
    local: Local;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DiscardedProductsService {

    private apiUrl = `${Common.url}/discarded`;

    constructor(private http: HttpClient) { }

    /** Obtiene todos los descartes */
    getAll(): Observable<DiscardedProduct[]> {
        return this.http.get<DiscardedProduct[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    /** Obtiene un descarte por id */
    getById(id: number): Observable<DiscardedProduct> {
        return this.http.get<DiscardedProduct>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    /** Edita un descarte existente */
    editDiscard(id: number, discard: any): Observable<string> {
        return this.http.put(`${this.apiUrl}/${id}`, discard, { headers: this.getHeaders(), responseType: 'text' });
    }

    /** Edita el campo active de un descarte existente */
    setActiveDescarte(id: number, active: boolean) {
        return this.http.put(`${this.apiUrl}/set-active/${id}/${active}`, null, { headers: this.getHeaders() });
    }

    /** Genera headers con token */
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return new HttpHeaders(headers);
    }

}
