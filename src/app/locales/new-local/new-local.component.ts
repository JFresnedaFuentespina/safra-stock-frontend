import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { Common } from '../../common';


@Component({
  selector: 'app-new-local',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FilterPipe],
  templateUrl: './new-local.component.html',
  styleUrl: './new-local.component.css'
})
export class NewLocalComponent implements OnInit {
  name: string = '';
  users: any[] = [];
  stockMinPerProduct: number = 1; // valor por defecto
  selectedUsers: any[] = [];
  searchTerm: string = '';
  localTypes: string[] = ['Tienda', 'Cocina'];
  selectedTypes: string[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.http.get<any[]>(`${Common.url}/users`).subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error("Error al obtener usuarios", err);
      }
    });
  }

  toggleTypeSelection(type: string, event: any) {
    if (event.target.checked) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    }
  }


  toggleUserSelection(user: any) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1); // Deseleccionar
    } else {
      this.selectedUsers.push(user); // Seleccionar
    }
  }

  isSelected(user: any): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  onSubmit() {
    if (!this.name.trim() || this.selectedUsers.length === 0) {
      alert("Nombre del local y al menos un trabajador son requeridos");
      return;
    }

    const local = {
      name: this.name,
      stockMinPerProduct: this.stockMinPerProduct,
      workers: this.selectedUsers.map(u => u.id),
      types: this.selectedTypes,
    };

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`${Common.url}/locales`, local, { headers }).subscribe({
      next: () => {
        alert("Local creado correctamente");
        this.router.navigate(['/locales']);
      },
      error: (err) => {
        console.error("Error al crear local", err);
        alert("Error al crear local");
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }
}
