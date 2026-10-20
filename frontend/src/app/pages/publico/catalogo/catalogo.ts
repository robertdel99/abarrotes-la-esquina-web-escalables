import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria, Producto } from '../../../interfaces';
import { nombreDe } from '../../../utils/nombre-de';
import { PublicoService } from '../../../services/publico.service';

const RETRASO_BUSQUEDA_MS = 400;

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit, OnDestroy {
  busqueda: WritableSignal<string> = signal('');
  categoriaSeleccionada: WritableSignal<string> = signal('');
  categorias: WritableSignal<Categoria[]> = signal([]);
  productos: WritableSignal<Producto[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(true);
  imagenesRotas: WritableSignal<string[]> = signal([]);
  nombreDe = nombreDe;

  soloOfertas = computed(() => this.ofertas() === 'true');
  visibles = computed(() =>
    this.soloOfertas() ? this.productos().filter((p) => p.enOferta) : this.productos(),
  );

  ofertas = input<string>();

  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private peticionActual = 0;

  private publico = inject(PublicoService);

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  onBusquedaInput(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.cargarProductos(), RETRASO_BUSQUEDA_MS);
  }

  onBuscarClick(): void {
    this.buscar();
  }

  onLimpiarClick(): void {
    this.busqueda.set('');
    this.buscar();
  }

  onCategoriaChange(evento: Event): void {
    this.categoriaSeleccionada.set((evento.target as HTMLSelectElement).value);
    this.cargarProductos();
  }

  onImagenError(id: string): void {
    this.imagenesRotas.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  tieneImagen(p: Producto): boolean {
    return !!p.imagen && !this.imagenesRotas().includes(p._id);
  }

  private buscar(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.cargarProductos();
  }

  private cargarCategorias(): void {
    this.publico
      .categorias()
      .subscribe({ next: (lista) => this.categorias.set(lista), error: () => {} });
  }

  private cargarProductos(): void {
    const numero = ++this.peticionActual;
    this.cargando.set(true);
    this.publico
      .productos({ buscar: this.busqueda().trim(), categoria: this.categoriaSeleccionada() })
      .subscribe({
        next: (lista) => {
          if (numero !== this.peticionActual) return;
          this.productos.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          if (numero !== this.peticionActual) return;
          this.productos.set([]);
          this.cargando.set(false);
        },
      });
  }
}
