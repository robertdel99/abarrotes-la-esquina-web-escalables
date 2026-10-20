import { Component, WritableSignal, effect, inject, input, signal, untracked } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../interfaces';
import { nombreDe } from '../../../utils/nombre-de';
import { PublicoService } from '../../../services/publico.service';

type Estado = 'cargando' | 'listo' | 'noEncontrado' | 'error';

@Component({
  selector: 'app-detalle-producto',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {
  producto: WritableSignal<Producto | null> = signal(null);
  estado: WritableSignal<Estado> = signal('cargando');
  imagenRota: WritableSignal<boolean> = signal(false);
  nombreDe = nombreDe;

  id = input.required<string>();

  private publico = inject(PublicoService);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargarProducto(id));
    });
  }

  onImagenError(): void {
    this.imagenRota.set(true);
  }

  private cargarProducto(id: string): void {
    this.estado.set('cargando');
    this.producto.set(null);
    this.imagenRota.set(false);
    this.publico.producto(id, true).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.estado.set('listo');
      },
      error: (err: HttpErrorResponse) => {
        this.estado.set(err.status === 404 || err.status === 400 ? 'noEncontrado' : 'error');
      },
    });
  }
}
