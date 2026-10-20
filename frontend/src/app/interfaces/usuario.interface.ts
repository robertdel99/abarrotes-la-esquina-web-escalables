export type Rol = 'cajero' | 'auxiliar' | 'administrador';

export interface Usuario {
  _id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  createdAt?: string;
}
