import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Common } from '../common';

export interface User {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    permisos?: string;
    enabled: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = Common.url + '/users';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    editUser(user: any): Observable<any> {
        console.log("USUARIO: " + JSON.stringify(user));
        return this.http.put(this.apiUrl, user, { headers: this.getHeaders() });
    }

    /** Desactiva un usuario */
    disableUser(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/disable/${id}`, null, { headers: this.getHeaders() });
    }

    /** Reactiva un usuario */
    enableUser(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/enable/${id}`, null, { headers: this.getHeaders() });
    }
}
