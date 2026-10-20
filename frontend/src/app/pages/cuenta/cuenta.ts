import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { Rol } from '../../interfaces';

const NOMBRE_ROL: Record<Rol, string> = {
  cajero: 'Cajero',
  auxiliar: 'Auxiliar',
  administrador: 'Administrador',
};

const CORREO_VALIDO = /^\S+@\S+\.\S+$/;

function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('contrasena')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-cuenta',
  imports: [ReactiveFormsModule],
  templateUrl: './cuenta.html',
  styleUrl: './cuenta.css',
})
export class Cuenta implements OnInit {
  guardandoDatos: WritableSignal<boolean> = signal(false);
  guardandoContrasena: WritableSignal<boolean> = signal(false);
  usuario = computed(() => this.auth.usuario());
  nombreRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? NOMBRE_ROL[rol] : '';
  });

  formDatos = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.pattern(CORREO_VALIDO)]],
  });

  formContrasena = inject(FormBuilder).nonNullable.group(
    {
      contrasenaActual: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', Validators.required],
    },
    { validators: contrasenasCoinciden },
  );

  private auth = inject(AuthService);
  private notificaciones = inject(NotificacionesService);

  ngOnInit(): void {
    const u = this.auth.usuario();
    this.formDatos.reset({
      nombre: u?.nombre ?? '',
      apellidos: u?.apellidos ?? '',
      correo: u?.correo ?? '',
    });
  }

  onDatosSubmit(): void {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }
    const { nombre, apellidos, correo } = this.formDatos.getRawValue();
    this.guardandoDatos.set(true);

    this.auth
      .actualizarPerfil({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
      })
      .pipe(finalize(() => this.guardandoDatos.set(false)))
      .subscribe({
        next: (u) => {
          this.formDatos.reset({ nombre: u.nombre, apellidos: u.apellidos, correo: u.correo });
          this.notificaciones.exito('Tus datos se guardaron');
        },
        error: () => {},
      });
  }

  onContrasenaSubmit(): void {
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }
    const { contrasenaActual, contrasena } = this.formContrasena.getRawValue();
    this.guardandoContrasena.set(true);

    this.auth
      .actualizarPerfil({ contrasena, contrasenaActual })
      .pipe(finalize(() => this.guardandoContrasena.set(false)))
      .subscribe({
        next: () => {
          this.formContrasena.reset();
          this.notificaciones.exito('Tu contraseña se cambió correctamente');
        },
        error: () => {},
      });
  }

  invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  noCoinciden(): boolean {
    return (
      this.formContrasena.hasError('noCoinciden') && this.formContrasena.controls.confirmar.touched
    );
  }
}
