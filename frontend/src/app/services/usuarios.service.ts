import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol, Usuario } from '../interfaces';
import { aParams } from '../utils/params';

export type DatosUsuario = Partial<Usuario> & { contrasena?: string };

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private base = '/api/usuarios';
  private http = inject(HttpClient);

  listar(filtros: { rol?: Rol; activo?: boolean } = {}): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  crear(datos: DatosUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, datos);
  }

  actualizar(id: string, datos: DatosUsuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
