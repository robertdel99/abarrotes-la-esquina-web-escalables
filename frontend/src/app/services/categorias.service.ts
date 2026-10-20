import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../interfaces';
import { aParams } from '../utils/params';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private base = '/api/categorias';
  private http = inject(HttpClient);

  listar(filtros: { activas?: boolean } = {}): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.base}/${id}`);
  }

  crear(datos: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<Categoria>(this.base, datos);
  }

  actualizar(id: string, datos: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
