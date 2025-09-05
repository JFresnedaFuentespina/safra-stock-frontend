import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../../navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService, Product } from '../product-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [NavbarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit {

  productForm!: FormGroup;
  productId!: number;
  selectedFile?: File;
  previewUrl?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      image: [null]
    });

    this.productService.getProductById(this.productId).subscribe((product: Product) => {
      this.productForm.patchValue({
        name: product.name,
        description: product.description
      });
      if (product.image) {
        // opcional: mostrar preview si tienes endpoint que devuelve imagen
        this.previewUrl = `data:image/jpeg;base64,${product.image}`;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Preview
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      const formData = new FormData();
      formData.append('name', this.productForm.get('name')?.value);
      formData.append('description', this.productForm.get('description')?.value);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.put(`http://192.168.1.20:8080/safra-stock/products/${this.productId}`, formData, { headers })
        .subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => {
            console.error('Error al actualizar producto', err);
            alert('Error al actualizar producto');
            if (err.status === 401 || err.status === 403) {
              this.router.navigate(['/login']);
            }
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/products']);
  }
}
