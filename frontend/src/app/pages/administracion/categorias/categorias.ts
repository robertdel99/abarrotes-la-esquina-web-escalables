import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoriasService } from '../../../services/categorias.service';
import { AuthService } from '../../../services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';
import { Categoria } from '../../../interfaces';

@Component({
  selector: 'app-categorias',
  imports: [ReactiveFormsModule, Confirmar],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias implements OnInit {
  categorias: WritableSignal<Categoria[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(false);
  guardando: WritableSignal<boolean> = signal(false);
  eliminando: WritableSignal<boolean> = signal(false);
  editando: WritableSignal<Categoria | null> = signal(null);
  aEliminar: WritableSignal<Categoria | null> = signal(null);

  mensajeEliminar = computed(() => {
    const categoria = this.aEliminar();
    return categoria
      ? `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`
      : '';
  });
  puedeEditar = computed(() => this.auth.tieneRol('auxiliar', 'administrador'));
  puedeEliminar = computed(() => this.auth.tieneRol('administrador'));

  formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
    descripcion: ['', [Validators.maxLength(200)]],
    activa: [true],
  });

  private servicio = inject(CategoriasService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  onActualizarClick(): void {
    this.cargarCategorias();
  }

  onNuevaClick(): void {
    this.limpiarFormulario();
  }

  onEditarClick(categoria: Categoria): void {
    this.editando.set(categoria);
    this.formulario.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activa: categoria.activa,
    });
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardarCategoria();
  }

  onCancelarClick(): void {
    this.limpiarFormulario();
  }

  onEliminarClick(categoria: Categoria): void {
    this.aEliminar.set(categoria);
  }

  onConfirmarEliminar(): void {
    const categoria = this.aEliminar();
    this.aEliminar.set(null);
    if (categoria) this.eliminarCategoria(categoria);
  }

  onCancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.servicio
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lista) => this.categorias.set(lista),
        error: () => {},
      });
  }

  guardarCategoria(): void {
    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      activa: valores.activa,
    };
    const actual = this.editando();

    this.guardando.set(true);
    const peticion = actual
      ? this.servicio.actualizar(actual._id, datos)
      : this.servicio.crear(datos);
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.notificaciones.exito(actual ? 'Categoría actualizada' : 'Categoría creada');
        this.limpiarFormulario();
        this.cargarCategorias();
      },
      error: () => {},
    });
  }

  eliminarCategoria(categoria: Categoria): void {
    this.eliminando.set(true);
    this.servicio
      .eliminar(categoria._id)
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: (respuesta) => {
          this.notificaciones.exito(respuesta.mensaje);
          if (this.editando()?._id === categoria._id) this.limpiarFormulario();
          this.cargarCategorias();
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
