import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { Common } from '../common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  name: string = '';
  password: string = '';
  role: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  onLogin() {
    const user = {
      name: this.name,
      password: this.password
    };

    this.http.post(`${Common.url}/login`, user).subscribe({
      next: (res: any) => {
        console.log("Usuario logueado", res);
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('username', user.name);

        // 🔹 Preparar headers con el token
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${res.token}`
        });

        this.http.get(`${Common.url}/users/${user.name}`, { headers }).subscribe({
          next: (userData: any) => {
            console.log("Datos del usuario:", userData);

            if (userData.roles && userData.roles.length > 0) {
              const role = userData.roles[0].name;
              localStorage.setItem('role', role);
            } else {
              localStorage.setItem('role', 'ROLE_USER');
            }

            this.router.navigate(['/main-menu']);
          },
          error: (err) => {
            console.error("Error al obtener datos del usuario", err);
            this.router.navigate(['/main-menu']);
          }
        });
      },
      error: (err) => {
        console.error("Error al loguear", err);
        alert("Error al loguear");
      }
    });
  }



  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
