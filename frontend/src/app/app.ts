import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notificaciones } from './components/notificaciones/notificaciones';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Notificaciones],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
