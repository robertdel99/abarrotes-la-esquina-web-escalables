import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Turno } from '../../../interfaces';
import { TurnosService } from '../../../services/turnos.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';
import { redondear } from '../../../utils/redondear';

const formatoDinero = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

@Component({
  selector: 'app-mi-turno',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, Confirmar],
  templateUrl: './mi-turno.html',
  styleUrl: './mi-turno.css',
})
export class MiTurno implements OnInit {
  cargando: WritableSignal<boolean> = signal(true);
  enviando: WritableSignal<boolean> = signal(false);
  turno: WritableSignal<Turno | null> = signal(null);
  corte: WritableSignal<Turno | null> = signal(null);
  confirmandoCierre: WritableSignal<boolean> = signal(false);
  mensajeCierre: WritableSignal<string> = signal('');

  efectivoEsperado = computed(() => {
    const t = this.turno();
    return t ? redondear(t.fondoInicial + t.totalVendido) : 0;
  });

  formAbrir = inject(FormBuilder).nonNullable.group({
    fondoInicial: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  formCerrar = inject(FormBuilder).nonNullable.group({
    efectivoContado: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  private turnosService = inject(TurnosService);
  private notificaciones = inject(NotificacionesService);

  ngOnInit(): void {
    this.cargarTurno();
  }

  onAbrirSubmit(): void {
    if (this.formAbrir.invalid) {
      this.formAbrir.markAllAsTouched();
      return;
    }
    const fondo = Number(this.formAbrir.getRawValue().fondoInicial);
    this.enviando.set(true);
    this.turnosService.abrir(fondo).subscribe({
      next: (t) => {
        this.turno.set(t);
        this.corte.set(null);
        this.formAbrir.reset();
        this.enviando.set(false);
        this.notificaciones.exito('Turno abierto');
      },
      error: () => this.enviando.set(false),
    });
  }

  onCerrarSubmit(): void {
    if (this.formCerrar.invalid) {
      this.formCerrar.markAllAsTouched();
      return;
    }
    const contado = Number(this.formCerrar.getRawValue().efectivoContado);
    this.mensajeCierre.set(
      `Efectivo contado: ${formatoDinero.format(contado)}. Efectivo esperado: ${formatoDinero.format(this.efectivoEsperado())}. ` +
        'Una vez cerrado, el turno ya no se puede modificar. ¿Deseas cerrarlo?',
    );
    this.confirmandoCierre.set(true);
  }

  onConfirmarCierreClick(): void {
    const t = this.turno();
    if (!t) return;
    this.confirmandoCierre.set(false);
    const contado = Number(this.formCerrar.getRawValue().efectivoContado);
    this.enviando.set(true);
    this.turnosService.cerrar(t._id, contado).subscribe({
      next: (cerrado) => {
        this.corte.set(cerrado);
        this.turno.set(null);
        this.formCerrar.reset();
        this.enviando.set(false);
        this.notificaciones.exito('Turno cerrado; corte de caja registrado');
      },
      error: () => this.enviando.set(false),
    });
  }

  onCancelarDialogoClick(): void {
    this.confirmandoCierre.set(false);
  }

  onNuevoTurnoClick(): void {
    this.corte.set(null);
  }

  cargarTurno(): void {
    this.cargando.set(true);
    this.turnosService.actual().subscribe({
      next: (t) => {
        this.turno.set(t);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  mostrarError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  claseDiferencia(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return 'text-success';
    return diferencia < 0 ? 'text-danger' : 'text-primary-emphasis';
  }

  textoDiferencia(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return 'La caja cuadra';
    return diferencia < 0 ? 'Faltante' : 'Sobrante';
  }
}
