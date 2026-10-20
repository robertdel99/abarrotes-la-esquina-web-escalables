import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta } from '../interfaces';
import { aParams } from '../utils/params';

export interface RenglonNuevaVenta {
  producto: string;
  cantidad: number;
}

export interface NuevaVenta {
  cliente?: string | null;
  renglones: RenglonNuevaVenta[];
  pagoRecibido: number;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  private base = '/api/ventas';
  private http = inject(HttpClient);

  registrar(venta: NuevaVenta): Observable<Venta> {
    return this.http.post<Venta>(this.base, venta);
  }

  listar(
    filtros: { turno?: string; desde?: string; hasta?: string; limite?: number } = {},
  ): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.base, { params: aParams(filtros) });
  }

  obtener(id: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.base}/${id}`);
  }

  cancelar(id: string): Observable<Venta> {
    return this.http.put<Venta>(`${this.base}/${id}/cancelar`, {});
  }
}
