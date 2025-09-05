import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, Pedido, ProductQuantity } from '../pedidos-service';
import { NavbarComponent } from "../../navbar/navbar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-pedido',
  standalone: true,
  templateUrl: './edit-pedido.component.html',
  styleUrls: ['./edit-pedido.component.css'],
  imports: [NavbarComponent, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditPedidoComponent implements OnInit {
  orderId!: number;
  pedido!: Pedido;
  locales: { name: string }[] = [];
  loading = true;
  error: string | null = null;

  form!: FormGroup;

  constructor(
    private pedidoService: PedidoService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));

    // Inicializamos el formulario
    this.form = this.fb.group({
      local: ['', Validators.required],
      products: this.fb.array([])
    });

    // Cargar locales
    this.pedidoService.getLocales().subscribe({
      next: (locals) => (this.locales = locals),
      error: (err) => console.error(err)
    });

    // Cargar pedido
    this.pedidoService.getOrderById(this.orderId).subscribe({
      next: (pedido) => {
        this.pedido = pedido;
        this.form.patchValue({ local: pedido.local });
        this.setProducts(pedido.products);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar el pedido';
        this.loading = false;
      }
    });
  }

  // FormArray de productos
  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  // Getter para que el HTML funcione con products[i].name
  get products(): { name: string; quantity: number }[] {
    return this.productsArray.controls.map(group => ({
      name: group.get('name')?.value,
      quantity: group.get('quantity')?.value
    }));
  }

  // Inicializa el FormArray con los productos del pedido
  private setProducts(products: ProductQuantity[]): void {
    const formGroups = products.map(p =>
      this.fb.group({
        name: [p.productName],
        quantity: [p.quantity, [Validators.required, Validators.min(0)]]
      })
    );
    const formArray = this.fb.array(formGroups);
    this.form.setControl('products', formArray);
  }

  // Enviar formulario
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const updatedPedido: Pedido = {
      orderId: this.pedido.orderId,
      local: this.form.value.local,
      products: this.form.value.products.map((p: any) => ({
        productName: p.name,
        quantity: p.quantity
      })),
      date: this.pedido.date,
      active: this.pedido.active
    };

    this.pedidoService.updateOrder(updatedPedido).subscribe({
      next: () => this.router.navigate(['/pedidos']),
      error: (err) => {
        console.error(err);
        this.error = 'Error al actualizar el pedido';
      }
    });
  }
}
