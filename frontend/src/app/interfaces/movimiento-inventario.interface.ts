import { Producto } from './producto.interface';
import { Proveedor } from './proveedor.interface';
import { Usuario } from './usuario.interface';

export type TipoMovimiento = 'entrada' | 'salida' | 'merma' | 'venta' | 'cancelacion';

export interface MovimientoInventario {
  _id: string;
  producto: Producto | string;
  tipo: TipoMovimiento;
  cantidad: number;
  existenciaAnterior: number;
  existenciaNueva: number;
  motivo: string;
  proveedor: Proveedor | string | null;
  venta: string | null;
  usuario: Usuario | string;
  fecha: string;
}
