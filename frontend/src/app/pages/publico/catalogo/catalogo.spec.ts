import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Catalogo } from './catalogo';
import { DetalleProducto } from '../detalle-producto/detalle-producto';

describe('catálogo público', () => {
  let http: HttpTestingController;
  let vista: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'catalogo', component: Catalogo },
          { path: 'catalogo/:id', component: DetalleProducto },
        ], withComponentInputBinding()),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vista = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  function consulta() {
    return http.expectOne((r) => r.url === '/api/publico/productos');
  }

  it('vuelve del detalle a la misma página y categoría', async () => {
    await vista.navigateByUrl('/catalogo?categoria=despensa&pagina=2', Catalogo);
    http.expectOne('/api/publico/categorias').flush([]);
    const arroz = { _id: 'arroz', nombre: 'Arroz', precioVenta: 32, disponible: true };
    consulta().flush({ productos: [arroz], pagina: 2, paginas: 2, total: 9 });
    vista.detectChanges();
    vista.routeNativeElement!.querySelector<HTMLAnchorElement>('h3 a')!.click();
    await vista.fixture.whenStable();
    http.expectOne('/api/publico/productos/arroz').flush(arroz);
    vista.detectChanges();
    vista.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href^="/catalogo?"]')!.click();
    await vista.fixture.whenStable();
    http.expectOne('/api/publico/categorias').flush([]);
    const alVolver = consulta();
    expect(alVolver.request.params.get('pagina')).toBe('2');
    expect(alVolver.request.params.get('categoria')).toBe('despensa');
    alVolver.flush({ productos: [arroz], pagina: 2, paginas: 2, total: 9 });
    vista.detectChanges();
    expect(vista.routeNativeElement?.textContent).toContain('Página 2 de 2');
  });

  it('conserva los filtros de la dirección y vuelve a la primera página al cambiarlos', async () => {
    const catalogo = await vista.navigateByUrl('/catalogo?pagina=2&ofertas=true', Catalogo);
    http.expectOne('/api/publico/categorias').flush([]);
    const segunda = consulta();
    expect(segunda.request.params.get('pagina')).toBe('2');
    expect(segunda.request.params.get('ofertas')).toBe('true');
    segunda.flush({ productos: [], pagina: 2, paginas: 2, total: 9 });
    vista.detectChanges();
    expect(vista.routeNativeElement?.textContent).toContain('Página 2 de 2');

    const disponibles = vista.routeNativeElement!.querySelector<HTMLInputElement>('.form-check-input')!;
    disponibles.click();
    await vista.fixture.whenStable();
    const filtrada = consulta();
    expect(filtrada.request.params.get('disponibles')).toBe('true');
    expect(filtrada.request.params.get('ofertas')).toBe('true');
    expect(filtrada.request.params.get('pagina')).toBe('1');
    expect(TestBed.inject(Router).url).not.toContain('pagina=2');
    filtrada.flush({ productos: [], pagina: 1, paginas: 1, total: 0 });
    vista.detectChanges();
    expect(catalogo.total()).toBe(0);
    expect(vista.routeNativeElement?.textContent).toContain('No hay productos');
  });

  it('distingue un fallo de conexión de una búsqueda vacía y permite reintentar', async () => {
    const catalogo = await vista.navigateByUrl('/catalogo?buscar=arroz', Catalogo);
    http.expectOne('/api/publico/categorias').flush([]);
    consulta().flush({}, { status: 503, statusText: 'No disponible' });
    vista.detectChanges();
    expect(vista.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
    catalogo.reintentar();
    vista.detectChanges();
    const repetida = consulta();
    expect(repetida.request.params.get('buscar')).toBe('arroz');
    repetida.flush({ productos: [], pagina: 1, paginas: 1, total: 0 });
    vista.detectChanges();
    expect(vista.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
  });
});
