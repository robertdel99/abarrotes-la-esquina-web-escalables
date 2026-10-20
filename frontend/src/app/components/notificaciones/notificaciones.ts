import { Component, computed, inject } from '@angular/core';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  imports: [],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones {
  lista = computed(() => this.servicio.lista());

  private servicio = inject(NotificacionesService);

  onCerrarClick(id: number): void {
    this.servicio.cerrar(id);
  }
}
