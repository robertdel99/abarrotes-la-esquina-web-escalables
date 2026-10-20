import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SILENCIAR_ERRORES = new HttpContextToken<boolean>(() => false);

export function contextoSilencioso(silenciar: boolean): HttpContext {
  return new HttpContext().set(SILENCIAR_ERRORES, silenciar);
}
