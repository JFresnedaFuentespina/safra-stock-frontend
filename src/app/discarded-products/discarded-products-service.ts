import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    disposalDate: string; // o Date si lo quieres convertir
    local: Local;
}

@Injectable({
    providedIn: 'root'
})
export class DiscardedProductsService {

    private apiUrl = `${Common.url}/discarded`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<DiscardedProduct[]> {
        return this.http.get<DiscardedProduct[]>(this.apiUrl);
    }
}
