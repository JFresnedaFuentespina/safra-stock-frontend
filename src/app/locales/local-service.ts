import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Common } from '../common';

export interface LocalDTO {
    id: number;
    name: string;
    stockMinPerProduct: number;
    workerNames: string[];
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocalService {
    private apiUrl = Common.url + '/locales';

    constructor(private http: HttpClient) { }

    /** Genera headers con token */
    private getHeaders(): { headers: HttpHeaders } {
        const token = localStorage.getItem('authToken');
        return {
            headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders()
        };
    }

    /** Obtener todos los locales */
    getLocales(): Observable<LocalDTO[]> {
        return this.http.get<LocalDTO[]>(this.apiUrl, this.getHeaders());
    }

    /** Obtener un local por id */
    getById(id: number): Observable<LocalDTO> {
        return this.http.get<LocalDTO>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    /** Crear un local */
    createLocal(payload: { name: string; workerIds: number[] }): Observable<LocalDTO> {
        return this.http.post<LocalDTO>(this.apiUrl, payload, this.getHeaders());
    }

    /** Actualizar un local existente */
    updateLocal(id: number, payload: { name: string; workerIds: number[] }): Observable<LocalDTO> {
        return this.http.put<LocalDTO>(`${this.apiUrl}/${id}`, payload, this.getHeaders());
    }

    /** Desactiva un local */
    disableLocal(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/disable/${id}`, null, this.getHeaders());
    }

    /** Reactiva un local */
    enableLocal(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/enable/${id}`, null, this.getHeaders());
    }
}
