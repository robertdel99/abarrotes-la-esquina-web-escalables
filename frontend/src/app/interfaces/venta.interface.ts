import { Cliente } from './cliente.interface';
import { Producto } from './producto.interface';
import { Turno } from './turno.interface';
import { Usuario } from './usuario.interface';

export interface RenglonVenta {
  producto: Producto | string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  _id: string;
  folio: string;
  turno: Turno | string;
  usuario: Usuario | string;
  cliente: Cliente | string | null;
  fecha: string;
  renglones: RenglonVenta[];
  total: number;
  pagoRecibido: number;
  cambio: number;
  estado: 'registrada' | 'cancelada';
}
