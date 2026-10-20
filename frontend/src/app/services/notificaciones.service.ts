import { Injectable, WritableSignal, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  lista: WritableSignal<Notificacion[]> = signal([]);
  private siguienteId = 0;

  exito(texto: string): void {
    this.agregar('exito', texto, 3500);
  }

  error(texto: string): void {
    this.agregar('error', texto, 6000);
  }

  info(texto: string): void {
    this.agregar('info', texto, 4000);
  }

  cerrar(id: number): void {
    this.lista.update((l) => l.filter((n) => n.id !== id));
  }

  private agregar(tipo: TipoNotificacion, texto: string, duracionMs: number): void {
    const id = ++this.siguienteId;
    this.lista.update((l) => [...l, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }
}
