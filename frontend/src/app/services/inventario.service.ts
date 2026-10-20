import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovimientoInventario, Producto, TipoMovimiento } from '../interfaces';
import { aParams } from '../utils/params';

export interface NuevoMovimiento {
  producto: string;
  tipo: Extract<TipoMovimiento, 'entrada' | 'salida' | 'merma'>;
  cantidad: number;
  motivo?: string;
  proveedor?: string | null;
}

export interface FiltrosMovimientos {
  producto?: string;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private base = '/api/inventario';
  private http = inject(HttpClient);

  movimientos(filtros: FiltrosMovimientos = {}): Observable<MovimientoInventario[]> {
    const params = aParams(filtros);
    return this.http.get<MovimientoInventario[]>(`${this.base}/movimientos`, { params });
  }

  registrar(movimiento: NuevoMovimiento): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(`${this.base}/movimientos`, movimiento);
  }

  bajos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/bajos`);
  }
}
