import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, InfoTienda, Producto } from '../interfaces';
import { aParams } from '../utils/params';
import { contextoSilencioso } from '../interceptors/http-context';

@Injectable({ providedIn: 'root' })
export class PublicoService {
  private base = '/api/publico';
  private http = inject(HttpClient);

  tienda(): Observable<InfoTienda> {
    return this.http.get<InfoTienda>(`${this.base}/tienda`);
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }

  productos(filtros: { buscar?: string; categoria?: string } = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/productos`, { params: aParams(filtros) });
  }

  producto(id: string, silenciarErrores = false): Observable<Producto> {
    const opciones = { context: contextoSilencioso(silenciarErrores) };
    return this.http.get<Producto>(`${this.base}/productos/${id}`, opciones);
  }

  ofertas(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/ofertas`);
  }
}
