import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from './users-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxPaginationModule, MatDialogModule, MatButtonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  users: any[] = [];
  page: number = 1;
  constructor(private userService: UserService, private router: Router, private dialog: MatDialog) { }

  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        this.users = data.map(user => ({
          id: user.id,
          nombre: user.name,
          correo: user.email,
          permisos: user.roles
            .map((role: any) => this.mapRoleName(role.name))
            .join(', '),
          active: user.enabled
        }));

      },
      error: (err) => {
        console.error('Error al obtener los usuarios:', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  mapRoleName(roleName: string): string {
    switch (roleName) {
      case 'ROLE_USER':
        return 'Usuario';
      case 'ROLE_ADMIN':
        return 'Administrador';
      default:
        return roleName;
    }
  }

  onNewUser() {
    this.router.navigate(['/users/nuevo'])
  }

  editarUsuario(id: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '400px',
      data: {
        nombre: user.nombre,
        correo: user.correo,
        permisos: user.permisos  // ahora es string, p.e. "Administrador" o "Usuario"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        user.nombre = result.nombre;
        user.correo = result.correo;

        const permisoSeleccionado = result.permisos; // string o undefined/null

        // Mapear a roles reales
        let mappedRoles = null;
        if (permisoSeleccionado === 'Administrador') {
          mappedRoles = [{ name: 'ROLE_ADMIN' }];
        } else if (permisoSeleccionado === 'Usuario') {
          mappedRoles = [{ name: 'ROLE_USER' }];
        }

        const userToSend = {
          id: user.id,
          name: user.nombre,
          email: user.correo,
          password: null,
          roles: mappedRoles  // puede ser null si no seleccionó nada
        };

        this.userService.editUser(userToSend).subscribe({
          next: (updatedUser: any) => {
            console.log('Usuario actualizado', updatedUser);
            // Actualizar la vista local según el rol real que venga de backend
            if (updatedUser.roles?.some((r: any) => r.name === 'ROLE_ADMIN')) {
              user.permisos = 'Administrador';
            } else if (updatedUser.roles?.some((r: any) => r.name === 'ROLE_USER')) {
              user.permisos = 'Usuario';
            } else {
              user.permisos = 'Sin rol';
            }
          },
          error: err => {
            console.error('Error actualizando usuario', err);
            if (err.status === 401 || err.status === 403) {
              this.router.navigate(['/login']);
            }
          }
        });
      }
    });
  }

  filterStatus: 'active' | 'inactive' | 'all' = 'active';

  get filteredUsers() {
    if (this.filterStatus === 'active') {
      return this.users.filter(u => u.active);
    } else if (this.filterStatus === 'inactive') {
      return this.users.filter(u => !u.active);
    } else {
      return this.users; // todos
    }
  }

  reactivarUsuario(id: number) {
    this.userService.enableUser(id).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === id);
        if (user) user.active = true;
        alert('Usuario reactivado correctamente');
      },
      error: err => {
        console.error('Error reactivando usuario', err);
        alert('No se pudo reactivar el usuario');
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  eliminarUsuario(id: number) {
    console.log("ELIMINAR");
    this.userService.disableUser(id).subscribe({
      next: () => {
        // Actualizar la lista local para reflejar el cambio
        const user = this.users.find(u => u.id === id);
        if (user) user.active = false;
        alert('Usuario desactivado correctamente');
      },
      error: err => {
        console.error('Error desactivando usuario', err);
        alert('No se pudo desactivar el usuario');
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

}
