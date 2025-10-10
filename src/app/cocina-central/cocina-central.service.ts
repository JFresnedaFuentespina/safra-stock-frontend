import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Common } from '../common';

export interface ProductStockCocina {
    productName: string;
    stock: number;
    productDate: string;
}

export interface StockCocinaGrouped {
    date: string;
    localName: string;
    products: ProductStockCocina[];
}

export interface Product {
    id: number;
    name: string;
    description: string;
    image: string | null;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CocinaCentralService {
    private apiUrl = `${Common.url}/cocina-central`;
    private productsUrl = `${Common.url}/products`;

    constructor(private http: HttpClient) { }

    getStockList(): Observable<StockCocinaGrouped[]> {
        const token = localStorage.getItem('authToken') || '';
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.get<StockCocinaGrouped[]>(`${this.apiUrl}/stock`, { headers });
    }

    getProductsList(): Observable<Product[]> {
        const token = localStorage.getItem('authToken') || '';
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        return this.http.get<Product[]>(this.productsUrl, { headers }).pipe(
            map(products => products.filter(product => product.active))
        );
    }

    saveStock(data: any): Observable<any> {
        const token = localStorage.getItem('authToken') || '';
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        console.log(data);
        return this.http.post(`${this.apiUrl}/stock`, data, { headers });
    }
}

