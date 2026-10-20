import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Cliente, Turno, Usuario, Venta } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { VentasService } from '../../../services/ventas.service';
import { TurnosService } from '../../../services/turnos.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';

function idDe(ref: { _id: string } | string | null | undefined): string | null {
  return ref ? (typeof ref === 'object' ? ref._id : ref) : null;
}

function inicioDelDia(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toISOString();
}

function finDelDia(fecha: string): string {
  return new Date(`${fecha}T23:59:59.999`).toISOString();
}

function rangoValido(grupo: AbstractControl): ValidationErrors | null {
  const { desde, hasta } = grupo.value as { desde: string; hasta: string };
  return desde && hasta && hasta < desde ? { rango: true } : null;
}

@Component({
  selector: 'app-ventas',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, Confirmar],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  cargando: WritableSignal<boolean> = signal(true);
  enviando: WritableSignal<boolean> = signal(false);
  ventas: WritableSignal<Venta[]> = signal([]);
  turnoActual: WritableSignal<Turno | null> = signal(null);
  verTodas: WritableSignal<boolean> = signal(false);
  expandida: WritableSignal<string | null> = signal(null);
  cancelando: WritableSignal<Venta | null> = signal(null);

  esAdmin = computed(() => this.auth.tieneRol('administrador'));
  columnas = computed(() => (this.esAdmin() ? 7 : 6));
  mostrandoSoloTurno = computed(
    () => !this.esAdmin() && !this.verTodas() && this.turnoActual() !== null,
  );
  mensajeCancelar = computed(() => {
    const v = this.cancelando();
    return v
      ? `Se cancelará la venta ${v.folio} y sus productos regresarán al inventario. ¿Deseas continuar?`
      : '';
  });

  filtros = inject(FormBuilder).nonNullable.group(
    {
      desde: [''],
      hasta: [''],
    },
    { validators: rangoValido },
  );

  private ventasService = inject(VentasService);
  private turnosService = inject(TurnosService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    if (this.esAdmin()) {
      this.buscarVentas();
    } else {
      this.turnosService.actual().subscribe({
        next: (t) => {
          this.turnoActual.set(t);
          this.buscarVentas();
        },
        error: () => this.buscarVentas(),
      });
    }
  }

  onBuscarSubmit(): void {
    this.buscarVentas();
  }

  onLimpiarClick(): void {
    this.filtros.reset();
    this.buscarVentas();
  }

  onVerTodasChange(): void {
    this.verTodas.update((v) => !v);
    this.buscarVentas();
  }

  onDetalleClick(id: string): void {
    this.expandida.update((actual) => (actual === id ? null : id));
  }

  onCancelarClick(venta: Venta): void {
    this.cancelando.set(venta);
  }

  onConfirmarCancelarClick(): void {
    const venta = this.cancelando();
    if (!venta) return;
    this.cancelando.set(null);
    this.enviando.set(true);
    this.ventasService.cancelar(venta._id).subscribe({
      next: (actualizada) => {
        this.ventas.update((lista) =>
          lista.map((v) => (v._id === actualizada._id ? actualizada : v)),
        );
        this.enviando.set(false);
        this.notificaciones.exito(`Venta ${actualizada.folio} cancelada`);
      },
      error: () => this.enviando.set(false),
    });
  }

  onCancelarDialogoClick(): void {
    this.cancelando.set(null);
  }

  buscarVentas(): void {
    if (this.filtros.invalid) return;
    const { desde, hasta } = this.filtros.getRawValue();
    const filtro: { turno?: string; desde?: string; hasta?: string } = {};
    if (desde) filtro.desde = inicioDelDia(desde);
    if (hasta) filtro.hasta = finDelDia(hasta);
    const turno = this.turnoActual();
    if (this.mostrandoSoloTurno() && turno) filtro.turno = turno._id;

    this.cargando.set(true);
    this.expandida.set(null);
    this.ventasService.listar(filtro).subscribe({
      next: (lista) => {
        this.ventas.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.ventas.set([]);
        this.cargando.set(false);
      },
    });
  }

  puedeCancelar(venta: Venta): boolean {
    if (venta.estado !== 'registrada') return false;
    if (this.esAdmin()) return true;
    const turno = this.turnoActual();
    return turno !== null && idDe(venta.turno) === turno._id;
  }

  nombreCliente(cliente: Cliente | string | null): string {
    if (cliente && typeof cliente === 'object')
      return `${cliente.nombre} ${cliente.apellidos}`.trim();
    return 'Público en general';
  }

  nombreUsuario(usuario: Usuario | string | null): string {
    if (usuario && typeof usuario === 'object')
      return `${usuario.nombre} ${usuario.apellidos}`.trim();
    return '-';
  }
}
