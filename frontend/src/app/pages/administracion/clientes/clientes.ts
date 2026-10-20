import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Cliente } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { ClientesService } from '../../../services/clientes.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';

type CampoCliente = 'nombre' | 'apellidos' | 'telefono' | 'correo';

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, Confirmar],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  clientes: WritableSignal<Cliente[]> = signal([]);
  cargando: WritableSignal<boolean> = signal(false);
  ultimaBusqueda: WritableSignal<string> = signal('');
  formBusqueda = inject(FormBuilder).nonNullable.group({ texto: '' });

  editando: WritableSignal<Cliente | null> = signal(null);
  enviando: WritableSignal<boolean> = signal(false);
  intentoEnviar: WritableSignal<boolean> = signal(false);
  formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    apellidos: [''],
    telefono: [''],
    correo: ['', [Validators.email]],
  });

  aEliminar: WritableSignal<Cliente | null> = signal(null);
  mensajeEliminar = computed(() => {
    const c = this.aEliminar();
    return c
      ? `¿Eliminar al cliente "${this.nombreCompleto(c)}"? Sus ventas anteriores se conservan.`
      : '';
  });
  esAdmin = computed(() => this.auth.tieneRol('administrador'));

  private clientesService = inject(ClientesService);
  private notificaciones = inject(NotificacionesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.cargar();
  }

  onBuscarSubmit(): void {
    this.buscar();
  }

  onLimpiarClick(): void {
    this.formBusqueda.reset();
    this.buscar();
  }

  onGuardarSubmit(): void {
    this.intentoEnviar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const datos = {
      nombre: v.nombre.trim(),
      apellidos: v.apellidos.trim(),
      telefono: v.telefono.trim(),
      correo: v.correo.trim(),
    };
    const editando = this.editando();
    const peticion = editando
      ? this.clientesService.actualizar(editando._id, datos)
      : this.clientesService.crear(datos);

    this.enviando.set(true);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: () => {
        this.notificaciones.exito(editando ? 'Cliente actualizado' : 'Cliente registrado');
        this.cancelarEdicion();
        this.cargar();
      },
      error: () => {},
    });
  }

  onEditarClick(c: Cliente): void {
    this.editando.set(c);
    this.intentoEnviar.set(false);
    this.formulario.reset({
      nombre: c.nombre,
      apellidos: c.apellidos ?? '',
      telefono: c.telefono ?? '',
      correo: c.correo ?? '',
    });
  }

  onCancelarClick(): void {
    this.cancelarEdicion();
  }

  onEliminarClick(c: Cliente): void {
    this.aEliminar.set(c);
  }

  onConfirmarEliminar(): void {
    const c = this.aEliminar();
    if (!c) return;
    this.aEliminar.set(null);
    this.clientesService.eliminar(c._id).subscribe({
      next: (res) => {
        this.notificaciones.exito(res.mensaje);
        if (this.editando()?._id === c._id) this.cancelarEdicion();
        this.cargar();
      },
      error: () => {},
    });
  }

  onCancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  nombreCompleto(c: Cliente): string {
    return `${c.nombre} ${c.apellidos ?? ''}`.trim();
  }

  errorDe(campo: CampoCliente): string {
    const control = this.formulario.controls[campo];
    if (!control.invalid || !(control.touched || this.intentoEnviar())) return '';
    if (control.hasError('required') || control.hasError('pattern'))
      return 'El nombre es obligatorio';
    if (control.hasError('email')) return 'El correo no es válido';
    return 'Valor no válido';
  }

  cargar(): void {
    this.cargando.set(true);
    this.clientesService
      .listar({ buscar: this.ultimaBusqueda() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lista) => this.clientes.set(lista),
        error: () => this.clientes.set([]),
      });
  }

  buscar(): void {
    this.ultimaBusqueda.set(this.formBusqueda.controls.texto.value.trim());
    this.cargar();
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.intentoEnviar.set(false);
    this.formulario.reset();
  }
}
