import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Categoria, Producto } from '../../../interfaces';
import { nombreDe } from '../../../utils/nombre-de';
import { PublicoService } from '../../../services/publico.service';

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit, OnDestroy {
  private publico = inject(PublicoService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);
  private parametros = toSignal(this.ruta.queryParamMap, { requireSync: true });
  private intento = signal(0);
  private temporizador?: ReturnType<typeof setTimeout>;

  busqueda = signal('');
  categoriaSeleccionada = computed(() => this.parametros().get('categoria') || '');
  soloOfertas = computed(() => this.parametros().get('ofertas') === 'true');
  soloDisponibles = computed(() => this.parametros().get('disponibles') === 'true');
  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);
  pagina = signal(1);
  paginas = signal(1);
  total = signal(0);
  cargando = signal(true);
  error = signal(false);
  imagenesRotas = signal<string[]>([]);
  nombreDe = nombreDe;

  constructor() {
    effect((alSalir) => {
      this.intento();
      const params = this.parametros();
      const buscar = params.get('buscar') || '';
      const pagina = Number(params.get('pagina'));
      this.busqueda.set(buscar);
      this.cargando.set(true);
      this.error.set(false);
      const peticion = this.publico.catalogo({
        buscar,
        categoria: this.categoriaSeleccionada(),
        ofertas: this.soloOfertas(),
        disponibles: this.soloDisponibles(),
        pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1,
      }).subscribe({
        next: (datos) => {
          this.productos.set(datos.productos);
          this.total.set(datos.total);
          this.pagina.set(datos.pagina);
          this.paginas.set(datos.paginas);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        },
      });
      alSalir(() => peticion.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.publico.categorias().subscribe({ next: (lista) => this.categorias.set(lista), error: () => {} });
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }

  escribir(texto: string): void {
    this.busqueda.set(texto);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.aplicar(), 400);
  }

  aplicar(cambios: { categoria?: string; ofertas?: boolean; disponibles?: boolean; pagina?: number } = {}): void {
    clearTimeout(this.temporizador);
    const categoria = cambios.categoria ?? this.categoriaSeleccionada();
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: {
        buscar: this.busqueda().trim() || null,
        categoria: categoria || null,
        ofertas: (cambios.ofertas ?? this.soloOfertas()) || null,
        disponibles: (cambios.disponibles ?? this.soloDisponibles()) || null,
        pagina: cambios.pagina && cambios.pagina > 1 ? cambios.pagina : null,
      },
    });
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    this.aplicar();
  }

  reintentar(): void {
    this.intento.update((valor) => valor + 1);
  }

  onImagenError(id: string): void {
    this.imagenesRotas.update((lista) => (lista.includes(id) ? lista : [...lista, id]));
  }

  tieneImagen(p: Producto): boolean {
    return !!p.imagen && !this.imagenesRotas().includes(p._id);
  }
}
