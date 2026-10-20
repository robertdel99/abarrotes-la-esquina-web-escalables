import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Turno } from '../interfaces';
import { aParams } from '../utils/params';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private base = '/api/turnos';
  private http = inject(HttpClient);

  actual(): Observable<Turno | null> {
    return this.http.get<Turno | null>(`${this.base}/actual`);
  }

  abrir(fondoInicial: number): Observable<Turno> {
    return this.http.post<Turno>(`${this.base}/abrir`, { fondoInicial });
  }

  cerrar(id: string, efectivoContado: number): Observable<Turno> {
    return this.http.put<Turno>(`${this.base}/${id}/cerrar`, { efectivoContado });
  }

  listar(filtros: { usuario?: string; estado?: 'abierto' | 'cerrado' } = {}): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Turno> {
    return this.http.get<Turno>(`${this.base}/${id}`);
  }
}
