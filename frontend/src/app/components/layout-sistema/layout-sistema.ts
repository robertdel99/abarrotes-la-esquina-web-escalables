import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Rol } from '../../interfaces';

interface OpcionMenu {
  ruta: string;
  texto: string;
  roles: Rol[];
}

const MENU: OpcionMenu[] = [
  { ruta: '/punto-de-venta', texto: 'Punto de venta', roles: ['cajero', 'administrador'] },
  { ruta: '/ventas', texto: 'Ventas', roles: ['cajero', 'administrador'] },
  { ruta: '/turno', texto: 'Mi turno y corte', roles: ['cajero', 'administrador'] },
  { ruta: '/turnos', texto: 'Historial de cortes', roles: ['administrador'] },
  { ruta: '/productos', texto: 'Productos', roles: ['auxiliar', 'administrador'] },
  { ruta: '/categorias', texto: 'Categorías', roles: ['auxiliar', 'administrador'] },
  { ruta: '/proveedores', texto: 'Proveedores', roles: ['auxiliar', 'administrador'] },
  { ruta: '/inventario', texto: 'Inventario', roles: ['auxiliar', 'administrador'] },
  { ruta: '/clientes', texto: 'Clientes', roles: ['cajero', 'administrador'] },
  { ruta: '/usuarios', texto: 'Usuarios', roles: ['administrador'] },
  { ruta: '/reportes', texto: 'Reportes', roles: ['administrador'] },
  { ruta: '/cuenta', texto: 'Mi cuenta', roles: ['cajero', 'auxiliar', 'administrador'] },
];

const NOMBRE_ROL: Record<Rol, string> = {
  cajero: 'Cajero',
  auxiliar: 'Auxiliar',
  administrador: 'Administrador',
};

@Component({
  selector: 'app-layout-sistema',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-sistema.html',
  styleUrl: './layout-sistema.css',
})
export class LayoutSistema {
  menuAbierto: WritableSignal<boolean> = signal(false);
  nombreCompleto = computed(() => this.auth.nombreCompleto());
  nombreRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? NOMBRE_ROL[rol] : '';
  });
  opciones = computed(() => {
    const rol = this.auth.rol();
    return rol ? MENU.filter((opcion) => opcion.roles.includes(rol)) : [];
  });

  private auth = inject(AuthService);

  onMenuClick(): void {
    this.menuAbierto.update((valor) => !valor);
  }

  onOpcionClick(): void {
    this.menuAbierto.set(false);
  }

  onSalirClick(): void {
    this.auth.logout();
  }
}
