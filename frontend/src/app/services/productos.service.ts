import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../interfaces';
import { aParams } from '../utils/params';

export type DatosProducto = Partial<
  Omit<Producto, '_id' | 'categoria' | 'proveedor' | 'disponible' | 'existenciaBaja'>
> & {
  categoria?: string;
  proveedor?: string;
};

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private base = '/api/productos';
  private http = inject(HttpClient);

  listar(
    filtros: { buscar?: string; categoria?: string; bajos?: boolean; activos?: boolean } = {},
  ): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.base}/${id}`);
  }

  crear(datos: DatosProducto): Observable<Producto> {
    return this.http.post<Producto>(this.base, datos);
  }

  actualizar(id: string, datos: DatosProducto): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
