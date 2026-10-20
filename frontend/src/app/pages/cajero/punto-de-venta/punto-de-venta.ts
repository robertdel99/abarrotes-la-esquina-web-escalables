import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Cliente, Producto, Turno, Venta } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { TurnosService } from '../../../services/turnos.service';
import { ProductosService } from '../../../services/productos.service';
import { ClientesService } from '../../../services/clientes.service';
import { VentasService } from '../../../services/ventas.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Confirmar } from '../../../components/confirmar/confirmar';
import { redondear } from '../../../utils/redondear';

interface RenglonTicket {
  producto: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  existencia: number;
  subtotal: number;
}

type PanelCliente = 'cerrado' | 'buscar' | 'nuevo';

function conCantidad(r: RenglonTicket, cantidad: number): RenglonTicket {
  return { ...r, cantidad, subtotal: redondear(r.precioUnitario * cantidad) };
}

@Component({
  selector: 'app-punto-de-venta',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, Confirmar],
  templateUrl: './punto-de-venta.html',
  styleUrl: './punto-de-venta.css',
})
export class PuntoDeVenta implements OnInit, OnDestroy {
  cargandoTurno: WritableSignal<boolean> = signal(true);
  turno: WritableSignal<Turno | null> = signal(null);
  hayTurno = computed(() => this.turno() !== null);

  busqueda: WritableSignal<string> = signal('');
  resultados: WritableSignal<Producto[]> = signal([]);
  buscando: WritableSignal<boolean> = signal(false);
  yaBusco: WritableSignal<boolean> = signal(false);

  renglones: WritableSignal<RenglonTicket[]> = signal([]);
  total = computed(() => redondear(this.renglones().reduce((suma, r) => suma + r.subtotal, 0)));
  articulos = computed(() => this.renglones().reduce((suma, r) => suma + r.cantidad, 0));
  avisoTicket: WritableSignal<string> = signal('');
  confirmandoCancelar: WritableSignal<boolean> = signal(false);

  cliente: WritableSignal<Cliente | null> = signal(null);
  panelCliente: WritableSignal<PanelCliente> = signal('cerrado');
  busquedaCliente: WritableSignal<string> = signal('');
  resultadosClientes: WritableSignal<Cliente[]> = signal([]);
  buscandoClientes: WritableSignal<boolean> = signal(false);
  yaBuscoClientes: WritableSignal<boolean> = signal(false);
  guardandoCliente: WritableSignal<boolean> = signal(false);
  puedeCrearClientes = computed(() => this.auth.tieneRol('cajero', 'administrador'));
  formCliente = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^[0-9 ()+-]{7,15}$/)]],
  });

  pagoControl = new FormControl<number | null>(null);
  pagoRecibido = toSignal(this.pagoControl.valueChanges, { initialValue: this.pagoControl.value });
  cambio = computed(() => {
    const pago = this.pagoRecibido();
    return pago === null || !Number.isFinite(pago) ? null : redondear(pago - this.total());
  });
  pagoInsuficiente = computed(() => {
    const c = this.cambio();
    return c !== null && c < 0;
  });
  faltante = computed(() => Math.abs(this.cambio() ?? 0));
  cobrando: WritableSignal<boolean> = signal(false);
  puedeCobrar = computed(
    () =>
      this.hayTurno() &&
      this.renglones().length > 0 &&
      this.cambio() !== null &&
      !this.pagoInsuficiente() &&
      !this.cobrando(),
  );

  ventaRegistrada: WritableSignal<Venta | null> = signal(null);

  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  private numeroBusqueda = 0;
  private temporizadorClientes?: ReturnType<typeof setTimeout>;
  private numeroBusquedaClientes = 0;

  private auth = inject(AuthService);
  private turnos = inject(TurnosService);
  private productos = inject(ProductosService);
  private clientes = inject(ClientesService);
  private ventas = inject(VentasService);
  private notificaciones = inject(NotificacionesService);

  ngOnInit(): void {
    this.turnos.actual().subscribe({
      next: (turno) => {
        this.turno.set(turno);
        this.cargandoTurno.set(false);
        if (turno) this.buscar();
      },
      error: () => this.cargandoTurno.set(false),
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorBusqueda);
    clearTimeout(this.temporizadorClientes);
  }

  onBusquedaInput(valor: string): void {
    this.busqueda.set(valor);
    clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = setTimeout(() => this.buscar(), 300);
  }

  onBuscarEnter(): void {
    this.buscar();
  }

  onAgregarClick(p: Producto): void {
    if (!this.puedeAgregar(p)) return;
    const existencia = this.existenciaDe(p);
    const enTicket = this.renglones().find((r) => r.producto === p._id);
    if (enTicket && enTicket.cantidad >= existencia) {
      this.avisoTicket.set(`Sólo hay ${existencia} de "${p.nombre}" en existencia`);
      return;
    }
    const precio = this.precioDe(p);
    this.avisoTicket.set('');
    this.renglones.update((lista) =>
      enTicket
        ? lista.map((r) =>
            r.producto === p._id
              ? conCantidad({ ...r, precioUnitario: precio, existencia }, r.cantidad + 1)
              : r,
          )
        : [
            ...lista,
            {
              producto: p._id,
              nombre: p.nombre,
              precioUnitario: precio,
              cantidad: 1,
              existencia,
              subtotal: precio,
            },
          ],
    );
  }

  onCambiarCantidadClick(r: RenglonTicket, delta: number): void {
    const nueva = r.cantidad + delta;
    if (nueva < 1) return;
    if (nueva > r.existencia) {
      this.avisoTicket.set(`Sólo hay ${r.existencia} de "${r.nombre}" en existencia`);
      return;
    }
    this.avisoTicket.set('');
    this.renglones.update((lista) =>
      lista.map((x) => (x.producto === r.producto ? conCantidad(x, nueva) : x)),
    );
  }

  onQuitarClick(r: RenglonTicket): void {
    this.avisoTicket.set('');
    this.renglones.update((lista) => lista.filter((x) => x.producto !== r.producto));
  }

  onCancelarTicketClick(): void {
    this.confirmandoCancelar.set(true);
  }

  onCerrarConfirmacionClick(): void {
    this.confirmandoCancelar.set(false);
  }

  onNuevaVentaClick(): void {
    this.ventaRegistrada.set(null);
    this.confirmandoCancelar.set(false);
    this.renglones.set([]);
    this.avisoTicket.set('');
    this.cliente.set(null);
    this.panelCliente.set('cerrado');
    this.pagoControl.reset();
  }

  onQuitarClienteClick(): void {
    this.elegirCliente(null);
  }

  onElegirClienteClick(c: Cliente): void {
    this.elegirCliente(c);
  }

  onBuscarClienteClick(): void {
    this.panelCliente.set('buscar');
    if (!this.yaBuscoClientes()) this.buscarClientes();
  }

  onCerrarPanelClienteClick(): void {
    this.panelCliente.set('cerrado');
  }

  onBusquedaClienteInput(valor: string): void {
    this.busquedaCliente.set(valor);
    clearTimeout(this.temporizadorClientes);
    this.temporizadorClientes = setTimeout(() => this.buscarClientes(), 300);
  }

  onBuscarClientesEnter(): void {
    this.buscarClientes();
  }

  onNuevoClienteClick(): void {
    this.formCliente.reset();
    this.panelCliente.set('nuevo');
  }

  onCancelarNuevoClienteClick(): void {
    this.panelCliente.set('buscar');
  }

  onSubmit(): void {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      return;
    }
    this.guardandoCliente.set(true);
    const datos = this.formCliente.getRawValue();
    this.clientes
      .crear({
        nombre: datos.nombre.trim(),
        apellidos: datos.apellidos.trim(),
        telefono: datos.telefono.trim(),
      })
      .subscribe({
        next: (c) => {
          this.guardandoCliente.set(false);
          this.yaBuscoClientes.set(false);
          this.elegirCliente(c);
          this.notificaciones.exito(`Cliente "${this.nombreCliente(c)}" registrado`);
        },
        error: () => this.guardandoCliente.set(false),
      });
  }

  onPagoEnter(): void {
    this.cobrar();
  }

  onCobrarClick(): void {
    this.cobrar();
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    const n = ++this.numeroBusqueda;
    this.buscando.set(true);
    this.productos.listar({ activos: true, buscar: this.busqueda().trim() }).subscribe({
      next: (lista) => {
        if (n !== this.numeroBusqueda) return;
        this.resultados.set(lista);
        this.buscando.set(false);
        this.yaBusco.set(true);
      },
      error: () => {
        if (n === this.numeroBusqueda) this.buscando.set(false);
      },
    });
  }

  buscarClientes(): void {
    clearTimeout(this.temporizadorClientes);
    const n = ++this.numeroBusquedaClientes;
    this.buscandoClientes.set(true);
    this.clientes.listar({ buscar: this.busquedaCliente().trim() }).subscribe({
      next: (lista) => {
        if (n !== this.numeroBusquedaClientes) return;
        this.resultadosClientes.set(lista);
        this.buscandoClientes.set(false);
        this.yaBuscoClientes.set(true);
      },
      error: () => {
        if (n === this.numeroBusquedaClientes) this.buscandoClientes.set(false);
      },
    });
  }

  elegirCliente(c: Cliente | null): void {
    this.cliente.set(c);
    this.panelCliente.set('cerrado');
  }

  cobrar(): void {
    if (!this.puedeCobrar()) return;
    this.cobrando.set(true);
    this.ventas
      .registrar({
        cliente: this.cliente()?._id ?? null,
        renglones: this.renglones().map((r) => ({ producto: r.producto, cantidad: r.cantidad })),
        pagoRecibido: this.pagoRecibido() ?? 0,
      })
      .subscribe({
        next: (venta) => {
          this.cobrando.set(false);
          this.ventaRegistrada.set(venta);
          this.turno.update(
            (t) =>
              t && {
                ...t,
                totalVendido: redondear(t.totalVendido + venta.total),
                numeroTickets: t.numeroTickets + 1,
              },
          );
          this.notificaciones.exito(`Venta ${venta.folio} registrada`);
          this.buscar();
        },
        error: () => {
          this.cobrando.set(false);
          this.buscar();
        },
      });
  }

  precioDe(p: Producto): number {
    return p.enOferta && p.precioOferta ? p.precioOferta : p.precioVenta;
  }

  existenciaDe(p: Producto): number {
    return p.existencia ?? 0;
  }

  puedeAgregar(p: Producto): boolean {
    return p.activo && this.existenciaDe(p) > 0;
  }

  nombreCliente(c: { nombre: string; apellidos: string }): string {
    return `${c.nombre} ${c.apellidos}`.trim();
  }

  nombreClienteVenta(venta: Venta): string {
    const c = venta.cliente;
    return c && typeof c === 'object' ? this.nombreCliente(c) : 'Público en general';
  }
}
