import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { LocalService } from './local-service';


@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxPaginationModule, FormsModule],
  templateUrl: './locales.component.html',
  styleUrl: './locales.component.css'
})
export class LocalesComponent {
  locales: any[] = [];
  page: number = 1;
  showInactive = false;

  constructor(private service: LocalService, private router: Router) { }

  ngOnInit() {
    this.loadLocales();
  }

  loadLocales() {
    this.service.getLocales().subscribe({
      next: data => { this.locales = data; console.log(this.locales) },
      error: err => {
        console.error('Error al cargar locales', err);
        if (err.status === 401 || err.status === 403) this.router.navigate(['/login']);
      }
    });
  }

  filterStatus: 'active' | 'inactive' | 'all' = 'active';

  get filteredLocales() {
    if (this.filterStatus === 'active') {
      return this.locales.filter(l => l.active);
    } else if (this.filterStatus === 'inactive') {
      return this.locales.filter(l => !l.active);
    } else {
      return this.locales; // todos
    }
  }

  onNewLocal() {
    this.router.navigate(['/locales/nuevo']);
  }

  editarLocal(id: number) {
    this.router.navigate(['/locales/edit', id]);
  }

  disableLocal(id: number) {
    if (!confirm('¿Deseas desactivar este local?')) return;
    this.service.disableLocal(id).subscribe({
      next: () => {
        const local = this.locales.find(l => l.id === id);
        if (local) local.active = false;
      },
      error: err => {
        console.error('Error al desactivar local', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }

    });
  }

  enableLocal(id: number) {
    this.service.enableLocal(id).subscribe({
      next: () => {
        const local = this.locales.find(l => l.id === id);
        if (local) local.active = true;
      },
      error: err => {
        console.error('Error al reactivar local', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }
}

