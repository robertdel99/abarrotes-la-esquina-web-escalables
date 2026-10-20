import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Turno, Usuario } from '../../../interfaces';
import { TurnosService } from '../../../services/turnos.service';
import { redondear } from '../../../utils/redondear';

type FiltroEstado = '' | 'abierto' | 'cerrado';

@Component({
  selector: 'app-turnos',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './turnos.html',
  styleUrl: './turnos.css',
})
export class Turnos implements OnInit {
  filtrosEstado: { valor: FiltroEstado; texto: string }[] = [
    { valor: '', texto: 'Todos' },
    { valor: 'abierto', texto: 'Abiertos' },
    { valor: 'cerrado', texto: 'Cerrados' },
  ];

  estado: WritableSignal<FiltroEstado> = signal('');
  cargando: WritableSignal<boolean> = signal(true);
  turnos: WritableSignal<Turno[]> = signal([]);

  private turnosService = inject(TurnosService);

  ngOnInit(): void {
    this.cargarTurnos();
  }

  onFiltrarClick(estado: FiltroEstado): void {
    if (estado === this.estado()) return;
    this.estado.set(estado);
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    const estado = this.estado();
    this.cargando.set(true);
    this.turnosService.listar(estado ? { estado } : {}).subscribe({
      next: (lista) => {
        this.turnos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.turnos.set([]);
        this.cargando.set(false);
      },
    });
  }

  nombreCajero(usuario: Usuario | string | null): string {
    if (usuario && typeof usuario === 'object')
      return `${usuario.nombre} ${usuario.apellidos}`.trim();
    return '-';
  }

  efectivoEsperado(turno: Turno): number {
    return turno.efectivoEsperado ?? redondear(turno.fondoInicial + turno.totalVendido);
  }

  claseDiferencia(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return 'text-success';
    return diferencia < 0 ? 'text-danger' : 'text-primary-emphasis';
  }
}
