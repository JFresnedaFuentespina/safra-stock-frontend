import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from "../../navbar/navbar.component";

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './new-product.component.html',
  styleUrl: './new-product.component.css'
})

export class NewProductComponent {
  name: string = '';
  description: string = '';
  imageFile: File | null = null;
  constructor(private http: HttpClient, private router: Router) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  onSubmit() {
    if (!this.name.trim() || !this.description.trim() || this.imageFile === null) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Leer archivo como base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;

      // Crear objeto producto con la imagen base64
      const product = {
        name: this.name,
        description: this.description,
        image: base64Image
      };

      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.post('http://192.168.1.20:8080/safra-stock/products', product, { headers }).subscribe({
        next: () => {
          alert('Producto creado correctamente');
          // Aquí redirigir o limpiar formulario si quieres
          this.router.navigate(['/products']);
        },
        error: (err) => {
          console.error('Error al crear producto', err);
          alert('Error al crear producto');
          if (err.status === 401 || err.status === 403) {
            this.router.navigate(['/login']);
          }
        }
      });
    };

    reader.readAsDataURL(this.imageFile); // lee el archivo y dispara onload
  }

}
