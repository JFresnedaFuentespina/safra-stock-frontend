import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../navbar/navbar.component";
import { ActivatedRoute, Router } from '@angular/router';
import { User, UserService } from '../../users/users-service';
import { LocalDTO, LocalService } from '../local-service';

@Component({
  selector: 'app-edit-local',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './edit-local.component.html',
  styleUrls: ['./edit-local.component.css']
})
export class EditLocalComponent implements OnInit {
  id?: number;
  name: string = '';
  stockMinPerProduct: number = 1;

  users: User[] = [];
  selectedUsers: User[] = [];

  // ✅ Tipos fijos
  types: string[] = ['Tienda', 'Cocina'];
  selectedTypes: string[] = [];

  searchTerm: string = '';

  constructor(
    private localService: LocalService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar usuarios antes de editar si corresponde
    this.userService.getUsers().subscribe(users => {
      this.users = users;
      if (this.id) this.loadLocal(this.id);
    });
  }

  loadLocal(id: number) {
    this.localService.getById(id).subscribe((local: LocalDTO) => {
      this.name = local.name;
      this.stockMinPerProduct = local.stockMinPerProduct ?? 1;
      this.selectedUsers = this.users.filter(u => local.workerNames.includes(u.name));
      this.selectedTypes = this.types.filter(t => local.types.includes(t));
    });
  }

  toggleUserSelection(user: User) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  isSelected(user: User): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  toggleTypeSelection(type: string) {
    const index = this.selectedTypes.indexOf(type);
    if (index >= 0) {
      this.selectedTypes.splice(index, 1);
    } else {
      this.selectedTypes.push(type);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes.includes(type);
  }

  onSubmit() {
    const payload = {
      name: this.name,
      stockMinPerProduct: this.stockMinPerProduct,
      workerIds: this.selectedUsers.map(u => u.id),
      types: this.selectedTypes
    };

    if (this.id) {
      this.localService.updateLocal(this.id, payload).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    } else {
      this.localService.createLocal(payload).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    }
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }
}
