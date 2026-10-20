import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmar',
  imports: [],
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.css',
})
export class Confirmar {
  abierto = input(false);
  titulo = input('Confirmar');
  mensaje = input('¿Deseas continuar?');
  textoAceptar = input('Aceptar');
  peligroso = input(false);
  aceptar = output<void>();
  cancelar = output<void>();

  onAceptarClick(): void {
    this.aceptar.emit();
  }

  onCancelarClick(): void {
    this.cancelar.emit();
  }

  onDialogoClick(evento: Event): void {
    evento.stopPropagation();
  }
}
