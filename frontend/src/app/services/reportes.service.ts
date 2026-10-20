import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { aParams } from '../utils/params';

export interface VentaPorDia {
  fecha: string;
  total: number;
  tickets: number;
}

export interface ReporteVentas {
  totalVentas: number;
  numeroTickets: number;
  ticketPromedio: number;
  porDia: VentaPorDia[];
}

export interface ProductoMasVendido {
  producto: string;
  nombre: string;
  cantidad: number;
  total: number;
}

export interface VentaPorCategoria {
  categoria: string;
  nombre: string;
  total: number;
  cantidad: number;
}

export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = '/api/reportes';
  private http = inject(HttpClient);

  ventas(rango: RangoFechas = {}): Observable<ReporteVentas> {
    const params = aParams(rango);
    return this.http.get<ReporteVentas>(`${this.base}/ventas`, { params });
  }

  productosMasVendidos(
    rango: RangoFechas & { limite?: number } = {},
  ): Observable<ProductoMasVendido[]> {
    const params = aParams(rango);
    return this.http.get<ProductoMasVendido[]>(`${this.base}/productos-mas-vendidos`, { params });
  }

  ventasPorCategoria(rango: RangoFechas = {}): Observable<VentaPorCategoria[]> {
    const params = aParams(rango);
    return this.http.get<VentaPorCategoria[]>(`${this.base}/ventas-por-categoria`, { params });
  }
}
