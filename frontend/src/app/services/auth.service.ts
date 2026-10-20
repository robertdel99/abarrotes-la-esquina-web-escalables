import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { RespuestaLogin, Rol, Usuario } from '../interfaces';
import { contextoSilencioso } from '../interceptors/http-context';

const CLAVE_TOKEN = 'ale_token';
const CLAVE_USUARIO = 'ale_usuario';

export interface DatosPerfil {
  nombre?: string;
  apellidos?: string;
  correo?: string;
  contrasena?: string;
  contrasenaActual?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario: WritableSignal<Usuario | null> = signal(leerUsuarioGuardado());
  autenticado = computed(() => this.usuario() !== null);
  rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre} ${u.apellidos}`.trim() : '';
  });

  private http = inject(HttpClient);
  private router = inject(Router);

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  login(correo: string, contrasena: string, silenciarErrores = false): Observable<RespuestaLogin> {
    const opciones = { context: contextoSilencioso(silenciarErrores) };
    return this.http.post<RespuestaLogin>('/api/auth/login', { correo, contrasena }, opciones).pipe(
      tap(({ token, usuario }) => {
        localStorage.setItem(CLAVE_TOKEN, token);
        this.guardarUsuario(usuario);
      }),
    );
  }

  logout(redirigir = true): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
    if (redirigir) this.router.navigate(['/login']);
  }

  tieneRol(...roles: Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  refrescarUsuario(u: Usuario): void {
    if (this.usuario()?._id === u._id) this.guardarUsuario(u);
  }

  actualizarPerfil(datos: DatosPerfil): Observable<Usuario> {
    return this.http
      .put<Usuario>('/api/auth/perfil', datos)
      .pipe(tap((u) => this.guardarUsuario(u)));
  }

  rutaInicio(): string {
    switch (this.rol()) {
      case 'cajero':
        return '/punto-de-venta';
      case 'auxiliar':
        return '/productos';
      case 'administrador':
        return '/reportes';
      default:
        return '/';
    }
  }

  private guardarUsuario(u: Usuario): void {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    this.usuario.set(u);
  }
}

function leerUsuarioGuardado(): Usuario | null {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    const token = localStorage.getItem(CLAVE_TOKEN);
    return guardado && token ? (JSON.parse(guardado) as Usuario) : null;
  } catch {
    return null;
  }
}
