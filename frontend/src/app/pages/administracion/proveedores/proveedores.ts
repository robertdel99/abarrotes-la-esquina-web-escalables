import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProveedoresService } from '../../../services/proveedores.service';
import { AuthService } from '../../../services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';
import { Proveedor } from '../../../interfaces';

@Component({
  selector: 'app-proveedores',
  imports: [ReactiveFormsModule, Confirmar],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css',
})
export class Proveedores implements OnInit {
  proveedores: WritableSignal<Proveedor[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(false);
  guardando: WritableSignal<boolean> = signal(false);
  eliminando: WritableSignal<boolean> = signal(false);
  editando: WritableSignal<Proveedor | null> = signal(null);
  aEliminar: WritableSignal<Proveedor | null> = signal(null);

  mensajeEliminar = computed(() => {
    const proveedor = this.aEliminar();
    return proveedor
      ? `¿Seguro que deseas eliminar al proveedor "${proveedor.nombre}"? Esta acción no se puede deshacer.`
      : '';
  });
  puedeEditar = computed(() => this.auth.tieneRol('auxiliar', 'administrador'));
  puedeEliminar = computed(() => this.auth.tieneRol('administrador'));

  formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    contacto: ['', [Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^[0-9\s()+-]*$/), Validators.maxLength(20)]],
    correo: ['', [Validators.email, Validators.maxLength(100)]],
    direccion: ['', [Validators.maxLength(200)]],
    activo: [true],
  });

  private servicio = inject(ProveedoresService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.cargarProveedores();
  }

  onActualizarClick(): void {
    this.cargarProveedores();
  }

  onNuevoClick(): void {
    this.limpiarFormulario();
  }

  onEditarClick(proveedor: Proveedor): void {
    this.editando.set(proveedor);
    this.formulario.reset({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto ?? '',
      telefono: proveedor.telefono ?? '',
      correo: proveedor.correo ?? '',
      direccion: proveedor.direccion ?? '',
      activo: proveedor.activo,
    });
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardarProveedor();
  }

  onCancelarClick(): void {
    this.limpiarFormulario();
  }

  onEliminarClick(proveedor: Proveedor): void {
    this.aEliminar.set(proveedor);
  }

  onConfirmarEliminar(): void {
    const proveedor = this.aEliminar();
    this.aEliminar.set(null);
    if (proveedor) this.eliminarProveedor(proveedor);
  }

  onCancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  cargarProveedores(): void {
    this.cargando.set(true);
    this.servicio
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lista) => this.proveedores.set(lista),
        error: () => {},
      });
  }

  guardarProveedor(): void {
    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      contacto: valores.contacto.trim(),
      telefono: valores.telefono.trim(),
      correo: valores.correo.trim(),
      direccion: valores.direccion.trim(),
      activo: valores.activo,
    };
    const actual = this.editando();

    this.guardando.set(true);
    const peticion = actual
      ? this.servicio.actualizar(actual._id, datos)
      : this.servicio.crear(datos);
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.notificaciones.exito(actual ? 'Proveedor actualizado' : 'Proveedor creado');
        this.limpiarFormulario();
        this.cargarProveedores();
      },
      error: () => {},
    });
  }

  eliminarProveedor(proveedor: Proveedor): void {
    this.eliminando.set(true);
    this.servicio
      .eliminar(proveedor._id)
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: (respuesta) => {
          this.notificaciones.exito(respuesta.mensaje);
          if (this.editando()?._id === proveedor._id) this.limpiarFormulario();
          this.cargarProveedores();
        },
        error: () => {},
      });
  }

  limpiarFormulario(): void {
    this.editando.set(null);
    this.formulario.reset();
  }

  invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
