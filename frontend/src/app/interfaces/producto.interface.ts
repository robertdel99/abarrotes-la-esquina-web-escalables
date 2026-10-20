import { Categoria } from './categoria.interface';
import { Proveedor } from './proveedor.interface';

export interface Producto {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: Categoria | string;
  proveedor: Proveedor | string;
  precioVenta: number;
  precioCompra?: number;
  unidadMedida: string;
  existencia?: number;
  existenciaMinima?: number;
  imagen: string;
  enOferta: boolean;
  precioOferta: number | null;
  activo: boolean;
  disponible?: boolean;
  existenciaBaja?: boolean;
}
