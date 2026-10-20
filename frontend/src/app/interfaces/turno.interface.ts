import { Usuario } from './usuario.interface';

export interface Turno {
  _id: string;
  usuario: Usuario | string;
  fechaApertura: string;
  fechaCierre: string | null;
  fondoInicial: number;
  totalVendido: number;
  numeroTickets: number;
  efectivoEsperado: number | null;
  efectivoContado: number | null;
  diferencia: number | null;
  estado: 'abierto' | 'cerrado';
}
