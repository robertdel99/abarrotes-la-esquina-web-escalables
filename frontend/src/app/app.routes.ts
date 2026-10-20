import { Routes } from '@angular/router';
import { LayoutPublico } from './components/layout-publico/layout-publico';
import { LayoutSistema } from './components/layout-sistema/layout-sistema';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutPublico,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/publico/inicio/inicio').then((m) => m.Inicio),
        title: 'Abarrotes La Esquina',
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./pages/publico/catalogo/catalogo').then((m) => m.Catalogo),
        title: 'Catálogo',
      },
      {
        path: 'catalogo/:id',
        loadComponent: () =>
          import('./pages/publico/detalle-producto/detalle-producto').then(
            (m) => m.DetalleProducto,
          ),
        title: 'Producto',
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
        title: 'Iniciar sesión',
      },
    ],
  },
  {
    path: '',
    component: LayoutSistema,
    canActivate: [authGuard],
    children: [
      {
        path: 'punto-de-venta',
        loadComponent: () =>
          import('./pages/cajero/punto-de-venta/punto-de-venta').then((m) => m.PuntoDeVenta),
        canActivate: [rolGuard('cajero', 'administrador')],
        title: 'Punto de venta',
      },
      {
        path: 'ventas',
        loadComponent: () => import('./pages/cajero/ventas/ventas').then((m) => m.Ventas),
        canActivate: [rolGuard('cajero', 'administrador')],
        title: 'Ventas',
      },
      {
        path: 'turno',
        loadComponent: () => import('./pages/cajero/mi-turno/mi-turno').then((m) => m.MiTurno),
        canActivate: [rolGuard('cajero', 'administrador')],
        title: 'Mi turno',
      },
      {
        path: 'turnos',
        loadComponent: () => import('./pages/administracion/turnos/turnos').then((m) => m.Turnos),
        canActivate: [rolGuard('administrador')],
        title: 'Historial de cortes',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/administracion/productos/productos').then((m) => m.Productos),
        canActivate: [rolGuard('auxiliar', 'administrador')],
        title: 'Productos',
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/administracion/categorias/categorias').then((m) => m.Categorias),
        canActivate: [rolGuard('auxiliar', 'administrador')],
        title: 'Categorías',
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./pages/administracion/proveedores/proveedores').then((m) => m.Proveedores),
        canActivate: [rolGuard('auxiliar', 'administrador')],
        title: 'Proveedores',
      },
      {
        path: 'inventario',
        loadComponent: () => import('./pages/inventario/inventario').then((m) => m.Inventario),
        canActivate: [rolGuard('auxiliar', 'administrador')],
        title: 'Inventario',
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/administracion/clientes/clientes').then((m) => m.Clientes),
        canActivate: [rolGuard('cajero', 'administrador')],
        title: 'Clientes',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/administracion/usuarios/usuarios').then((m) => m.Usuarios),
        canActivate: [rolGuard('administrador')],
        title: 'Usuarios',
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes').then((m) => m.Reportes),
        canActivate: [rolGuard('administrador')],
        title: 'Reportes',
      },
      {
        path: 'cuenta',
        loadComponent: () => import('./pages/cuenta/cuenta').then((m) => m.Cuenta),
        title: 'Mi cuenta',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
