import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  role: string | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    console.log(this.role);
  }

  isAdmin(): boolean {
    return this.role === 'ROLE_ADMIN';
  }

  isUser(): boolean {
    return this.role === 'ROLE_USER';
  }

  goToProducts() {
    this.router.navigate(["/products"]);
  }

  goToPedidos() {
    this.router.navigate(["/pedidos"]);
  }

  goToDesperdicios() {
    this.router.navigate(["/desperdicios"]);
  }

  goToUsuarios() {
    this.router.navigate(["/users"]);
  }

  goToLocales() {
    this.router.navigate(["/locales"]);
  }

  goToStock() {
    this.router.navigate(["/stock"]);
  }
  
  goToCocinaCentral() {
    this.router.navigate(["/cocina-central/stock"]);
  }

  goToStats() {
    this.router.navigate(["/stats"]);
  }

  goToCuenta() {
    this.router.navigate(['/cuenta']);
  }

}
