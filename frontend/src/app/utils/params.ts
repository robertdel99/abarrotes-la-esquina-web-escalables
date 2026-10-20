import { HttpParams } from '@angular/common/http';

export function aParams(filtros: object = {}): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros as Record<string, unknown>)) {
    if (valor === undefined || valor === null || valor === '') continue;
    params = params.set(clave, String(valor));
  }
  return params;
}
