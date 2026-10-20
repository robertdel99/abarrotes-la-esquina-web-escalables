import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { Rol } from '../interfaces';

export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notificaciones = inject(NotificacionesService);

    if (!auth.autenticado()) return router.createUrlTree(['/login']);
    if (auth.tieneRol(...roles)) return true;

    notificaciones.error('No tienes permiso para entrar a esa sección');
    return router.createUrlTree([auth.rutaInicio()]);
  };
