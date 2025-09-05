import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})


export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  passwordMismatch: boolean = false;
  constructor(private http: HttpClient, private router: Router) { }
  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }
    this.passwordMismatch = false;

    const user = {
      name: this.name,
      email: this.email,
      password: this.password
    }
    this.http.post('http://192.168.1.20:8080/safra-stock/users/register', user).subscribe({
      next: (res: any) => {
        console.log("Usuario registrado", res);
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('username', user.name);
        this.router.navigate(['/main-menu']);
      },
      error: (err) => {
        console.error("Error al registrar", err);
        alert("Error al registrar");
      }
    })
  }
  goToLogin() { this.router.navigate(['login']) }

}
