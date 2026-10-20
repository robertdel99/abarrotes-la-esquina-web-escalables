import {
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { Rol, Usuario } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { DatosUsuario, UsuariosService } from '../../../services/usuarios.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';

type CampoUsuario = 'nombre' | 'apellidos' | 'correo' | 'contrasena' | 'rol';

const ROLES: Rol[] = ['cajero', 'auxiliar', 'administrador'];
const NOMBRE_ROL: Record<Rol, string> = {
  cajero: 'Cajero',
  auxiliar: 'Auxiliar',
  administrador: 'Administrador',
};
const MENSAJE_REQUERIDO: Record<CampoUsuario, string> = {
  nombre: 'El nombre es obligatorio',
  apellidos: 'Los apellidos son obligatorios',
  correo: 'El correo es obligatorio',
  contrasena: 'La contraseña es obligatoria',
  rol: 'Elige un rol',
};

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, Confirmar],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  roles: Rol[] = ROLES;
  nombreRol: Record<Rol, string> = NOMBRE_ROL;
  textoPropio = 'No puedes modificar tu propia cuenta aquí';

  usuarios: WritableSignal<Usuario[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(false);
  conFiltros: WritableSignal<boolean> = signal(false);
  filtros = inject(FormBuilder).nonNullable.group({
    rol: '' as Rol | '',
    activo: '' as '' | 'true' | 'false',
  });

  editando: WritableSignal<Usuario | null> = signal(null);
  enviando: WritableSignal<boolean> = signal(false);
  intentoEnviar: WritableSignal<boolean> = signal(false);
  formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['cajero' as Rol, [Validators.required]],
    activo: [true],
  });
  editandoPropio = computed(() => {
    const e = this.editando();
    return e !== null && this.esPropio(e);
  });

  cambiandoEstado: WritableSignal<string | null> = signal(null);
  aEliminar: WritableSignal<Usuario | null> = signal(null);
  mensajeEliminar = computed(() => {
    const u = this.aEliminar();
    return u
      ? `¿Eliminar al usuario "${this.nombreCompleto(u)}"? Si tiene turnos o ventas registradas sólo se marcará como inactivo.`
      : '';
  });

  private usuariosService = inject(UsuariosService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.filtros.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());
    this.cargar();
  }

  onGuardarSubmit(): void {
    this.intentoEnviar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const editando = this.editando();

    let peticion: Observable<Usuario>;
    if (editando) {
      const datos: DatosUsuario = {
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo: v.correo.trim(),
        rol: v.rol,
      };
      if (v.contrasena) datos.contrasena = v.contrasena;
      if (!this.esPropio(editando)) datos.activo = v.activo;
      peticion = this.usuariosService.actualizar(editando._id, datos);
    } else {
      peticion = this.usuariosService.crear({
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo: v.correo.trim(),
        contrasena: v.contrasena,
        rol: v.rol,
      });
    }

    this.enviando.set(true);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (u) => {
        if (editando) this.auth.refrescarUsuario(u);
        this.notificaciones.exito(editando ? 'Usuario actualizado' : 'Usuario creado');
        this.cancelarEdicion();
        this.cargar();
      },
      error: () => {},
    });
  }

  onEditarClick(u: Usuario): void {
    this.editando.set(u);
    this.intentoEnviar.set(false);
    this.formulario.controls.contrasena.setValidators([Validators.minLength(8)]);
    this.formulario.reset({
      nombre: u.nombre,
      apellidos: u.apellidos,
      correo: u.correo,
      contrasena: '',
      rol: u.rol,
      activo: u.activo,
    });
    if (this.esPropio(u)) {
      this.formulario.controls.activo.disable();
      this.formulario.controls.rol.disable();
    } else {
      this.formulario.controls.activo.enable();
      this.formulario.controls.rol.enable();
    }
  }

  onCancelarClick(): void {
    this.cancelarEdicion();
  }

  onCambiarActivoClick(u: Usuario): void {
    if (this.esPropio(u) || this.cambiandoEstado() !== null) return;
    this.cambiandoEstado.set(u._id);
    this.usuariosService
      .actualizar(u._id, { activo: !u.activo })
      .pipe(finalize(() => this.cambiandoEstado.set(null)))
      .subscribe({
        next: (actualizado) => {
          this.notificaciones.exito(
            actualizado.activo ? 'Usuario activado' : 'Usuario desactivado',
          );
          this.cargar();
        },
        error: () => {},
      });
  }

  onEliminarClick(u: Usuario): void {
    this.aEliminar.set(u);
  }

  onConfirmarEliminar(): void {
    const u = this.aEliminar();
    if (!u) return;
    this.aEliminar.set(null);
    this.usuariosService.eliminar(u._id).subscribe({
      next: (res) => {
        if (res.mensaje.includes('inactivo')) this.notificaciones.info(res.mensaje);
        else this.notificaciones.exito(res.mensaje);
        if (this.editando()?._id === u._id) this.cancelarEdicion();
        this.cargar();
      },
      error: () => {},
    });
  }

  onCancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  nombreCompleto(u: Usuario): string {
    return `${u.nombre} ${u.apellidos}`.trim();
  }

  esPropio(u: Usuario): boolean {
    return u._id === this.auth.usuario()?._id;
  }

  errorDe(campo: CampoUsuario): string {
    const control = this.formulario.controls[campo];
    if (!control.invalid || !(control.touched || this.intentoEnviar())) return '';
    if (control.hasError('required')) return MENSAJE_REQUERIDO[campo];
    if (control.hasError('email')) return 'El correo no es válido';
    if (control.hasError('minlength')) return 'La contraseña debe tener al menos 8 caracteres';
    return 'Valor no válido';
  }

  cargar(): void {
    const { rol, activo } = this.filtros.getRawValue();
    this.conFiltros.set(rol !== '' || activo !== '');
    this.cargando.set(true);
    this.usuariosService
      .listar({ rol: rol || undefined, activo: activo === '' ? undefined : activo === 'true' })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lista) => this.usuarios.set(lista),
        error: () => this.usuarios.set([]),
      });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.intentoEnviar.set(false);
    this.formulario.controls.contrasena.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.formulario.controls.activo.enable();
    this.formulario.controls.rol.enable();
    this.formulario.reset();
  }
}
