import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../interfaces';
import { aParams } from '../utils/params';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private base = '/api/clientes';
  private http = inject(HttpClient);

  listar(filtros: { buscar?: string } = {}): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  crear(datos: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, datos);
  }

  actualizar(id: string, datos: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
