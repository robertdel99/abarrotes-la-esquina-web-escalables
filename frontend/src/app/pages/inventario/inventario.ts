import {
  Component,
  DestroyRef,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import {
  MovimientoInventario,
  Producto,
  Proveedor,
  TipoMovimiento,
  Usuario,
} from '../../interfaces';
import { AuthService } from '../../services/auth.service';
import { InventarioService, NuevoMovimiento } from '../../services/inventario.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { nombreDe } from '../../utils/nombre-de';

type Pestana = 'movimientos' | 'registrar' | 'bajos';
type TipoManual = NuevoMovimiento['tipo'];

const ETIQUETA_TIPO: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  merma: 'Merma',
  venta: 'Venta',
  cancelacion: 'Cancelación',
};

const COLOR_TIPO: Record<TipoMovimiento, string> = {
  entrada: 'text-bg-success',
  salida: 'text-bg-warning',
  merma: 'text-bg-danger',
  venta: 'text-bg-secondary',
  cancelacion: 'text-bg-info',
};

const TIPOS_QUE_SUMAN: TipoMovimiento[] = ['entrada', 'cancelacion'];

function motivoObligatorio(grupo: AbstractControl): ValidationErrors | null {
  const tipo = grupo.get('tipo')?.value as TipoManual;
  const motivo = String(grupo.get('motivo')?.value ?? '').trim();
  return tipo !== 'entrada' && !motivo ? { motivoRequerido: true } : null;
}

@Component({
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  pestana: WritableSignal<Pestana> = signal('movimientos');
  productos: WritableSignal<Producto[]> = signal([]);
  proveedores: WritableSignal<Proveedor[]> = signal([]);
  movimientos: WritableSignal<MovimientoInventario[]> = signal([]);
  cargandoMovimientos: WritableSignal<boolean> = signal(false);
  enviando: WritableSignal<boolean> = signal(false);
  enviado: WritableSignal<boolean> = signal(false);
  bajos: WritableSignal<Producto[]> = signal([]);
  cargandoBajos: WritableSignal<boolean> = signal(false);
  bajosCargados: WritableSignal<boolean> = signal(false);
  tiposFiltro: TipoMovimiento[] = ['entrada', 'salida', 'merma', 'venta', 'cancelacion'];
  tiposManuales: TipoManual[] = ['entrada', 'salida', 'merma'];

  filtros = inject(FormBuilder).nonNullable.group({
    producto: '',
    tipo: '' as '' | TipoMovimiento,
    desde: '',
    hasta: '',
  });

  formulario = inject(FormBuilder).nonNullable.group(
    {
      producto: ['', Validators.required],
      tipo: ['entrada' as TipoManual, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      motivo: '',
      proveedor: '',
    },
    { validators: motivoObligatorio },
  );

  tipoSeleccionado: Signal<TipoManual> = toSignal(this.formulario.controls.tipo.valueChanges, {
    initialValue: this.formulario.controls.tipo.value,
  });

  productoSeleccionado: Signal<string> = toSignal(this.formulario.controls.producto.valueChanges, {
    initialValue: this.formulario.controls.producto.value,
  });

  puedeRegistrar = computed(() => this.auth.tieneRol('auxiliar', 'administrador'));
  productosActivos = computed(() => this.productos().filter((producto) => producto.activo));
  proveedoresActivos = computed(() => this.proveedores().filter((proveedor) => proveedor.activo));
  esEntrada = computed(() => this.tipoSeleccionado() === 'entrada');
  productoActual = computed(() => {
    const id = this.productoSeleccionado();
    return id ? (this.productos().find((producto) => producto._id === id) ?? null) : null;
  });

  private inventarioService = inject(InventarioService);
  private productosService = inject(ProductosService);
  private proveedoresService = inject(ProveedoresService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarMovimientos());
    this.productosService.listar().subscribe((lista) => this.productos.set(lista));
    this.proveedoresService.listar().subscribe((lista) => this.proveedores.set(lista));
    this.cargarMovimientos();
  }

  onPestanaClick(pestana: Pestana): void {
    this.pestana.set(pestana);
    if (pestana === 'bajos' && !this.bajosCargados()) {
      this.cargarBajos();
    }
  }

  onFiltrosSubmit(): void {
    this.cargarMovimientos();
  }

  onLimpiarFiltrosClick(): void {
    this.filtros.reset();
  }

  onRegistrarSubmit(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.registrarMovimiento();
  }

  onLimpiarFormularioClick(): void {
    this.formulario.reset();
    this.enviado.set(false);
  }

  onActualizarBajosClick(): void {
    this.cargarBajos();
  }

  cargarMovimientos(): void {
    const valores = this.filtros.getRawValue();
    this.cargandoMovimientos.set(true);
    this.inventarioService
      .movimientos({
        producto: valores.producto,
        tipo: valores.tipo || undefined,
        desde: valores.desde,
        hasta: valores.hasta,
      })
      .subscribe({
        next: (lista) => {
          this.movimientos.set(lista);
          this.cargandoMovimientos.set(false);
        },
        error: () => this.cargandoMovimientos.set(false),
      });
  }

  registrarMovimiento(): void {
    const valores = this.formulario.getRawValue();
    const datos: NuevoMovimiento = {
      producto: valores.producto,
      tipo: valores.tipo,
      cantidad: Number(valores.cantidad),
      motivo: valores.motivo.trim(),
      proveedor: valores.tipo === 'entrada' && valores.proveedor ? valores.proveedor : null,
    };
    this.enviando.set(true);
    this.inventarioService.registrar(datos).subscribe({
      next: (movimiento) => {
        this.enviando.set(false);
        this.notificaciones.exito('Movimiento registrado');
        const idProducto =
          typeof movimiento.producto === 'object' ? movimiento.producto._id : movimiento.producto;
        this.productos.update((lista) =>
          lista.map((producto) =>
            producto._id === idProducto
              ? { ...producto, existencia: movimiento.existenciaNueva }
              : producto,
          ),
        );
        this.bajosCargados.set(false);
        this.formulario.reset();
        this.enviado.set(false);
        this.pestana.set('movimientos');
        this.cargarMovimientos();
      },
      error: () => this.enviando.set(false),
    });
  }

  cargarBajos(): void {
    this.cargandoBajos.set(true);
    this.inventarioService.bajos().subscribe({
      next: (lista) => {
        this.bajos.set(lista);
        this.bajosCargados.set(true);
        this.cargandoBajos.set(false);
      },
      error: () => this.cargandoBajos.set(false),
    });
  }

  etiquetaTipo(tipo: TipoMovimiento): string {
    return ETIQUETA_TIPO[tipo] ?? tipo;
  }

  colorTipo(tipo: TipoMovimiento): string {
    return COLOR_TIPO[tipo] ?? 'text-bg-light';
  }

  suma(tipo: TipoMovimiento): boolean {
    return TIPOS_QUE_SUMAN.includes(tipo);
  }

  codigoProducto(movimiento: MovimientoInventario): string {
    return movimiento.producto && typeof movimiento.producto === 'object'
      ? movimiento.producto.codigo
      : '-';
  }

  nombreProducto(movimiento: MovimientoInventario): string {
    return nombreDe(movimiento.producto);
  }

  nombreProveedor(movimiento: MovimientoInventario): string {
    return nombreDe(movimiento.proveedor, '-');
  }

  nombreUsuario(movimiento: MovimientoInventario): string {
    const usuario = movimiento.usuario as Usuario | string;
    return usuario && typeof usuario === 'object'
      ? `${usuario.nombre} ${usuario.apellidos}`.trim()
      : '-';
  }

  nombreCategoria(producto: Producto): string {
    return nombreDe(producto.categoria);
  }

  campoInvalido(nombre: 'producto' | 'cantidad'): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.enviado());
  }

  motivoInvalido(): boolean {
    const control = this.formulario.controls.motivo;
    return this.formulario.hasError('motivoRequerido') && (control.touched || this.enviado());
  }
}
