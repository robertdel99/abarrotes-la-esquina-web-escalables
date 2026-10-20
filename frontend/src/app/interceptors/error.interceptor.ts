import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorApi } from '../interfaces';
import { AuthService } from '../services/auth.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { SILENCIAR_ERRORES } from './http-context';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notificaciones = inject(NotificacionesService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const cuerpo = (err.error ?? {}) as Partial<ErrorApi>;
      const mensaje =
        cuerpo.mensaje ??
        (err.status === 0 ? 'No se pudo conectar con el servidor' : 'Ocurrió un error inesperado');
      const detalles = cuerpo.detalles ?? [];
      const esLogin = req.url.endsWith('/api/auth/login');

      if (err.status === 401 && !esLogin) {
        if (auth.autenticado()) {
          auth.logout();
          notificaciones.error('Tu sesión terminó, inicia sesión de nuevo');
        }
      } else if (!req.context.get(SILENCIAR_ERRORES)) {
        notificaciones.error(detalles.length ? `${mensaje}: ${detalles.join('. ')}` : mensaje);
      }
      return throwError(() => err);
    }),
  );
};

export function mensajeDeError(err: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  const cuerpo = (err as HttpErrorResponse)?.error as Partial<ErrorApi> | undefined;
  if (!cuerpo?.mensaje) return porDefecto;
  if (!cuerpo.detalles?.length) return cuerpo.mensaje;
  return `${cuerpo.mensaje}: ${cuerpo.detalles.join('. ')}`;
}
