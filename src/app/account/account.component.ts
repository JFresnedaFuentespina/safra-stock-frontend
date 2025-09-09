import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Common } from '../common';

interface UserDTO {
  name: string;
  email: string;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {

  user: UserDTO | null = null;

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    const username = localStorage.getItem('username');
    if (username) {
      this.http.get<UserDTO>(`${Common.url}/users/${username}`)
        .subscribe({
          next: (data) => {
            console.log("Usuario recibido:", data);
            this.user = data;
          },
          error: (err) => {
            console.error("Error al obtener el usuario:", err);
            if (err.status === 401 || err.status === 403) {
              this.router.navigate(['/login']);
            }
          }
        });
    } else {
      console.warn("No se encontró el username en localStorage.");
      this.router.navigate(['/login']); // opcional: redirigir si no hay usuario
    }
  }

  logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
