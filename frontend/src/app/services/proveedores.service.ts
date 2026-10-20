import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../interfaces';
import { aParams } from '../utils/params';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private base = '/api/proveedores';
  private http = inject(HttpClient);

  listar(filtros: { activos?: boolean; buscar?: string } = {}): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.base}/${id}`);
  }

  crear(datos: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, datos);
  }

  actualizar(id: string, datos: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
