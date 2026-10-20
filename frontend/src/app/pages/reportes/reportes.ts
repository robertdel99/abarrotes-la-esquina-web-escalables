import {
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  ProductoMasVendido,
  ReporteVentas,
  ReportesService,
  VentaPorCategoria,
} from '../../services/reportes.service';

const DIAS_POR_DEFECTO = 30;

interface Rango {
  desde: string;
  hasta: string;
}

interface DiaConBarra {
  fecha: string;
  total: number;
  tickets: number;
  porcentaje: number;
}

interface CategoriaConBarra extends VentaPorCategoria {
  porcentaje: number;
}

function aFechaIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function hace(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

function porcentaje(valor: number, maximo: number): number {
  return maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
}

function rangoOrdenado(grupo: AbstractControl): ValidationErrors | null {
  const desde = grupo.get('desde')?.value as string;
  const hasta = grupo.get('hasta')?.value as string;
  return desde && hasta && desde > hasta ? { rangoInvalido: true } : null;
}

@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  hoy: string = aFechaIso(new Date());

  formulario = inject(FormBuilder).nonNullable.group(
    {
      desde: [aFechaIso(hace(DIAS_POR_DEFECTO)), Validators.required],
      hasta: [this.hoy, Validators.required],
    },
    { validators: rangoOrdenado },
  );

  cargando: WritableSignal<boolean> = signal(false);
  cargado: WritableSignal<boolean> = signal(false);
  fallo: WritableSignal<boolean> = signal(false);
  rangoAplicado: WritableSignal<Rango | null> = signal(null);

  resumen: WritableSignal<ReporteVentas | null> = signal(null);
  productos: WritableSignal<ProductoMasVendido[]> = signal([]);
  categoriasCrudas: WritableSignal<VentaPorCategoria[]> = signal([]);

  esAdministrador = computed(() => this.auth.tieneRol('administrador'));

  dias = computed<DiaConBarra[]>(() => {
    const porDia = this.resumen()?.porDia ?? [];
    const maximo = Math.max(0, ...porDia.map((d) => d.total));
    return porDia.map((d) => ({ ...d, porcentaje: porcentaje(d.total, maximo) }));
  });

  categorias = computed<CategoriaConBarra[]>(() => {
    const lista = this.categoriasCrudas();
    const maximo = Math.max(0, ...lista.map((c) => c.total));
    return lista.map((c) => ({ ...c, porcentaje: porcentaje(c.total, maximo) }));
  });

  private reportes = inject(ReportesService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.esAdministrador()) this.cargarReportes();
  }

  onSubmit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.cargando()) return;

    const rango = this.formulario.getRawValue();
    this.cargando.set(true);
    this.fallo.set(false);

    forkJoin({
      ventas: this.reportes.ventas(rango),
      productos: this.reportes.productosMasVendidos({ ...rango, limite: 10 }),
      categorias: this.reportes.ventasPorCategoria(rango),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ ventas, productos, categorias }) => {
          this.resumen.set(ventas);
          this.productos.set(productos);
          this.categoriasCrudas.set(categorias);
          this.rangoAplicado.set(rango);
          this.cargado.set(true);
          this.cargando.set(false);
        },
        error: () => {
          this.fallo.set(true);
          this.cargando.set(false);
        },
      });
  }
}
