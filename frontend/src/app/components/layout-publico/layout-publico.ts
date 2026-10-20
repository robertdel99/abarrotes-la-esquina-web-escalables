import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout-publico',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-publico.html',
  styleUrl: './layout-publico.css',
})
export class LayoutPublico {
  abierto: WritableSignal<boolean> = signal(false);
  autenticado = computed(() => this.auth.autenticado());
  rutaInicio = computed(() => this.auth.rutaInicio());

  private auth = inject(AuthService);

  onMenuClick(): void {
    this.abierto.update((valor) => !valor);
  }

  onEnlaceClick(): void {
    this.abierto.set(false);
  }
}
