import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InfoTienda, Producto } from '../../../interfaces';
import { nombreDe } from '../../../utils/nombre-de';
import { PublicoService } from '../../../services/publico.service';

@Component({
  selector: 'app-inicio',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  tienda: WritableSignal<InfoTienda | null> = signal(null);
  ofertas: WritableSignal<Producto[]> = signal([]);
  cargandoOfertas: WritableSignal<boolean> = signal(true);
  cargandoTienda: WritableSignal<boolean> = signal(true);
  imagenesRotas: WritableSignal<string[]> = signal([]);
  nombreDe = nombreDe;

  private publico = inject(PublicoService);

  ngOnInit(): void {
    this.cargarTienda();
    this.cargarOfertas();
  }

  onImagenError(id: string): void {
    this.imagenesRotas.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  enlaceTelefono(telefono: string): string {
    return 'tel:' + telefono.replace(/\s+/g, '');
  }

  tieneImagen(p: Producto): boolean {
    return !!p.imagen && !this.imagenesRotas().includes(p._id);
  }

  private cargarTienda(): void {
    this.publico.tienda().subscribe({
      next: (t) => {
        this.tienda.set(t);
        this.cargandoTienda.set(false);
      },
      error: () => this.cargandoTienda.set(false),
    });
  }

  private cargarOfertas(): void {
    this.publico.ofertas().subscribe({
      next: (lista) => {
        this.ofertas.set(lista);
        this.cargandoOfertas.set(false);
      },
      error: () => this.cargandoOfertas.set(false),
    });
  }
}
