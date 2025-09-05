import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from "../../navbar/navbar.component";

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {

  name: string = '';
  password: string = '';
  email: string = '';
  admin: boolean = false;

  constructor(private http: HttpClient, private router: Router) { }

  createUser() {
    const user = {
      name: this.name,
      email: this.email,
      password: this.password,
      admin: this.admin
    };

    const token = localStorage.getItem('authToken');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://192.168.1.20:8080/safra-stock/users', user, { headers })
      .subscribe({
        next: (response: any) => {
          this.router.navigate(['/users']);
        },
        error: err => {
          console.error('Error al crear usuario:', err);
          alert('Error al crear usuario. Verifica que tengas permisos.');
        }
      });
  }

}
