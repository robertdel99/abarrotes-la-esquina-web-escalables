import { Usuario } from './usuario.interface';

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

export interface ErrorApi {
  mensaje: string;
  detalles?: string[];
}
