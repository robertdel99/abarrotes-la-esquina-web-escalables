import { Component, OnInit, WritableSignal, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { mensajeDeError } from '../../../interceptors/error.interceptor';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  cargando: WritableSignal<boolean> = signal(false);
  error: WritableSignal<string | null> = signal(null);
  form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  volverA = input<string>();

  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.auth.autenticado()) this.router.navigateByUrl(this.auth.rutaInicio());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { correo, contrasena } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(correo.trim(), contrasena, true).subscribe({
      next: () =>
        this.router.navigateByUrl(this.destino()).then((navego) => {
          if (!navego) this.cargando.set(false);
        }),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo iniciar sesión'));
        this.cargando.set(false);
      },
    });
  }

  invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  private destino(): string {
    const ruta = this.volverA();
    return ruta && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : this.auth.rutaInicio();
  }
}
