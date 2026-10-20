import {
  Component,
  DestroyRef,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { Categoria, Producto, Proveedor } from '../../../interfaces';
import { nombreDe } from '../../../utils/nombre-de';
import { AuthService } from '../../../services/auth.service';
import { DatosProducto, ProductosService } from '../../../services/productos.service';
import { CategoriasService } from '../../../services/categorias.service';
import { ProveedoresService } from '../../../services/proveedores.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';

function validarOferta(grupo: AbstractControl): ValidationErrors | null {
  if (!grupo.get('enOferta')?.value) return null;
  const oferta = grupo.get('precioOferta')?.value;
  const venta = grupo.get('precioVenta')?.value;
  if (oferta === null || oferta === undefined || oferta === '') return { ofertaRequerida: true };
  if (venta === null || venta === undefined || venta === '') return null;
  if (Number(oferta) >= Number(venta)) return { ofertaMayor: true };
  return null;
}

function idDe(ref: { _id: string } | string): string {
  return typeof ref === 'object' ? ref._id : ref;
}

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, CurrencyPipe, Confirmar],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  nombreDe = nombreDe;

  productos: WritableSignal<Producto[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(false);
  categorias: WritableSignal<Categoria[]> = signal([]);
  proveedores: WritableSignal<Proveedor[]> = signal([]);

  filtros = inject(FormBuilder).nonNullable.group({ buscar: '', categoria: '', bajos: false });
  valorFiltros = toSignal(this.filtros.valueChanges, { initialValue: this.filtros.getRawValue() });
  hayFiltros = computed(() => {
    const f = this.valorFiltros();
    return !!(f.buscar?.trim() || f.categoria || f.bajos);
  });

  formularioAbierto: WritableSignal<boolean> = signal(false);
  editando: WritableSignal<Producto | null> = signal(null);
  guardando: WritableSignal<boolean> = signal(false);
  intentoEnviar: WritableSignal<boolean> = signal(false);

  form = inject(FormBuilder).nonNullable.group(
    {
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: '',
      categoria: ['', Validators.required],
      proveedor: ['', Validators.required],
      precioVenta: [null as number | null, [Validators.required, Validators.min(0)]],
      precioCompra: [null as number | null, [Validators.required, Validators.min(0)]],
      unidadMedida: ['pieza', Validators.required],
      existencia: [0, [Validators.required, Validators.min(0)]],
      existenciaMinima: [5, [Validators.required, Validators.min(0)]],
      imagen: '',
      activo: true,
      enOferta: false,
      precioOferta: [null as number | null, Validators.min(0)],
    },
    { validators: validarOferta },
  );

  imagenValor: Signal<string> = toSignal(this.form.controls.imagen.valueChanges, {
    initialValue: '',
  });
  imagenUrl = computed(() => this.imagenValor().trim());
  imagenRota: WritableSignal<boolean> = linkedSignal({
    source: this.imagenUrl,
    computation: () => false,
  });
  enOferta: Signal<boolean> = toSignal(this.form.controls.enOferta.valueChanges, {
    initialValue: false,
  });

  aEliminar: WritableSignal<Producto | null> = signal(null);
  eliminando: WritableSignal<boolean> = signal(false);
  mensajeEliminar = computed(() => {
    const p = this.aEliminar();
    return p
      ? `¿Eliminar "${p.nombre}" (${p.codigo})? Si tiene ventas registradas sólo se marcará como inactivo.`
      : '';
  });
  esAdmin = computed(() => this.auth.tieneRol('administrador'));

  private productosService = inject(ProductosService);
  private categoriasService = inject(CategoriasService);
  private proveedoresService = inject(ProveedoresService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarProductos());
    this.cargarProductos();
    this.categoriasService.listar().subscribe((lista) => this.categorias.set(lista));
    this.proveedoresService.listar().subscribe((lista) => this.proveedores.set(lista));
  }

  onBuscarSubmit(): void {
    this.cargarProductos();
  }

  onLimpiarClick(): void {
    this.filtros.reset();
  }

  onNuevoClick(): void {
    this.editando.set(null);
    this.form.reset();
    this.intentoEnviar.set(false);
    this.formularioAbierto.set(true);
  }

  onEditarClick(p: Producto): void {
    this.editando.set(p);
    this.form.reset({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoria: idDe(p.categoria),
      proveedor: idDe(p.proveedor),
      precioVenta: p.precioVenta,
      precioCompra: p.precioCompra ?? null,
      unidadMedida: p.unidadMedida || 'pieza',
      existencia: p.existencia ?? 0,
      existenciaMinima: p.existenciaMinima ?? 5,
      imagen: p.imagen ?? '',
      activo: p.activo,
      enOferta: p.enOferta,
      precioOferta: p.precioOferta,
    });
    this.intentoEnviar.set(false);
    this.formularioAbierto.set(true);
  }

  onCerrarClick(): void {
    if (this.guardando()) return;
    this.formularioAbierto.set(false);
  }

  onGuardarSubmit(): void {
    this.guardarProducto();
  }

  onImagenError(): void {
    this.imagenRota.set(true);
  }

  onEliminarClick(p: Producto): void {
    this.aEliminar.set(p);
  }

  onConfirmarEliminar(): void {
    this.eliminarProducto();
  }

  onCancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  cargarProductos(): void {
    const { buscar, categoria, bajos } = this.filtros.getRawValue();
    this.cargando.set(true);
    this.productosService
      .listar({ buscar: buscar.trim(), categoria, bajos: bajos || undefined })
      .subscribe({
        next: (lista) => {
          this.productos.set(lista);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  guardarProducto(): void {
    this.intentoEnviar.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const editando = this.editando();
    const datos: DatosProducto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      categoria: v.categoria,
      proveedor: v.proveedor,
      precioVenta: Number(v.precioVenta),
      precioCompra: Number(v.precioCompra),
      unidadMedida: v.unidadMedida.trim(),
      existenciaMinima: Number(v.existenciaMinima),
      imagen: v.imagen.trim(),
    };
    if (!editando) datos.existencia = Number(v.existencia);
    if (this.esAdmin()) {
      datos.activo = v.activo;
      datos.enOferta = v.enOferta;
      datos.precioOferta = v.enOferta ? Number(v.precioOferta) : null;
    }

    this.guardando.set(true);
    const peticion = editando
      ? this.productosService.actualizar(editando._id, datos)
      : this.productosService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.formularioAbierto.set(false);
        this.notificaciones.exito(editando ? 'Producto actualizado' : 'Producto creado');
        this.cargarProductos();
      },
      error: () => this.guardando.set(false),
    });
  }

  eliminarProducto(): void {
    const p = this.aEliminar();
    if (!p || this.eliminando()) return;
    this.eliminando.set(true);
    this.productosService.eliminar(p._id).subscribe({
      next: ({ mensaje }) => {
        this.eliminando.set(false);
        this.aEliminar.set(null);
        this.notificaciones.info(mensaje);
        this.cargarProductos();
      },
      error: () => {
        this.eliminando.set(false);
        this.aEliminar.set(null);
      },
    });
  }

  mensajeDe(campo: string): string {
    const c = this.form.get(campo);
    if (!c || c.valid || !(c.touched || this.intentoEnviar())) return '';
    if (c.hasError('required')) return 'Este campo es obligatorio';
    if (c.hasError('min')) return 'No puede ser negativo';
    return 'Valor no válido';
  }

  mensajePrecioVenta(): string {
    const propio = this.mensajeDe('precioVenta');
    if (propio) return propio;
    const c = this.form.controls.precioVenta;
    if (
      !this.esAdmin() &&
      this.form.hasError('ofertaMayor') &&
      (c.touched || this.intentoEnviar())
    ) {
      return 'Debe ser mayor que el precio de oferta vigente';
    }
    return '';
  }

  mensajeOferta(): string {
    if (!(this.form.controls.precioOferta.touched || this.intentoEnviar())) return '';
    if (this.form.hasError('ofertaRequerida')) return 'Indica el precio de oferta';
    if (this.form.hasError('ofertaMayor'))
      return 'El precio de oferta debe ser menor que el precio de venta';
    return this.mensajeDe('precioOferta');
  }
}
