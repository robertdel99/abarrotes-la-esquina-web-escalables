const BASE = process.env.API_URL || 'http://localhost:3000';
let pasan = 0,
  fallan = 0;

const tokens = {};
async function api(metodo, ruta, { body, rol } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (rol) headers.Authorization = `Bearer ${tokens[rol]}`;
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}
function ok(condicion, nombre, extra = '') {
  if (condicion) {
    pasan++;
    console.log(`  OK ${nombre}`);
  } else {
    fallan++;
    console.log(`  FALLA ${nombre} ${extra}`);
  }
}
const casi = (a, b) => Math.abs(a - b) < 0.001;

async function main() {
  console.log(`Probando API en ${BASE}\n`);

  console.log('Público (sin sesión)');
  let r = await api('GET', '/api/salud');
  ok(r.status === 200 && r.data.ok, 'GET /api/salud');
  r = await api('GET', '/api/publico/productos');
  ok(
    r.status === 200 && r.data.length === 12,
    'catálogo público con 12 productos',
    `(${r.status}, ${r.data && r.data.length})`
  );
  ok(
    r.data &&
      r.data.every(
        (p) => p.precioCompra === undefined && p.existencia === undefined && typeof p.disponible === 'boolean'
      ),
    'el público no ve precio de compra ni existencia, sí "disponible"'
  );
  r = await api('GET', '/api/publico/ofertas');
  ok(r.status === 200 && r.data.length === 3, 'ofertas de la semana (3)');
  r = await api('GET', '/api/publico/tienda');
  ok(r.status === 200 && r.data.nombre, 'datos de la tienda');
  r = await api('GET', '/api/productos');
  ok(r.status === 401, 'sin token -> 401 en rutas privadas', `(${r.status})`);
  r = await api('GET', '/api/no-existe');
  ok(r.status === 404 && r.data.mensaje, 'ruta inexistente -> 404 JSON');

  console.log('\nInicio de sesión');
  for (const [rol, correo, contrasena] of [
    ['admin', 'admin@laesquina.com', 'Admin1234'],
    ['cajero', 'cajero@laesquina.com', 'Cajero1234'],
    ['auxiliar', 'auxiliar@laesquina.com', 'Auxiliar1234'],
  ]) {
    r = await api('POST', '/api/auth/login', { body: { correo, contrasena } });
    tokens[rol] = r.data && r.data.token;
    ok(
      r.status === 200 && tokens[rol] && r.data.usuario && r.data.usuario.contrasena === undefined,
      `login ${rol} (sin exponer contraseña)`
    );
  }
  r = await api('POST', '/api/auth/login', { body: { correo: 'admin@laesquina.com', contrasena: 'mala' } });
  ok(r.status === 401, 'contraseña incorrecta -> 401');
  r = await api('GET', '/api/auth/perfil', { rol: 'cajero' });
  ok(r.status === 200 && r.data.rol === 'cajero', 'GET perfil');
  r = await api('PUT', '/api/auth/perfil', {
    rol: 'cajero',
    body: { contrasena: 'Nueva12345', contrasenaActual: 'mala' },
  });
  ok(r.status === 400, 'cambiar contraseña con la actual incorrecta -> 400');
  r = await api('PUT', '/api/auth/perfil', { rol: 'cajero', body: { telefono: 'x', nombre: 'Ana María' } });
  ok(r.status === 200 && r.data.nombre === 'Ana María', 'actualizar nombre del perfil');

  console.log('\nProductos y catálogo interno');
  r = await api('GET', '/api/productos', { rol: 'cajero' });
  ok(
    r.status === 200 && r.data[0].existencia !== undefined && r.data[0].categoria.nombre,
    'cajero lista productos con existencia y populate'
  );
  const productos = r.data;
  const aceite = productos.find((p) => p.codigo === 'A-1001'),
    arroz = productos.find((p) => p.codigo === 'A-1002'),
    detergente = productos.find((p) => p.codigo === 'C-4001');
  r = await api('GET', '/api/categorias', { rol: 'auxiliar' });
  const catId = r.data[0]._id;
  ok(r.status === 200 && r.data.length === 5, 'auxiliar lista categorías');
  r = await api('GET', '/api/proveedores', { rol: 'auxiliar' });
  const provId = r.data[0]._id;
  ok(r.status === 200 && r.data.length === 3, 'auxiliar lista proveedores');
  const nuevo = {
    codigo: 'T-9001',
    nombre: 'Producto prueba',
    categoria: catId,
    proveedor: provId,
    precioVenta: 10,
    precioCompra: 7,
    existencia: 5,
    enOferta: true,
    precioOferta: 8,
  };
  r = await api('POST', '/api/productos', { rol: 'cajero', body: nuevo });
  ok(r.status === 403, 'cajero no puede crear productos -> 403');
  r = await api('POST', '/api/productos', { rol: 'auxiliar', body: nuevo });
  ok(
    r.status === 201 && r.data.enOferta === false,
    'auxiliar crea producto; la oferta se ignora',
    `(${r.status}, enOferta=${r.data && r.data.enOferta})`
  );
  const idPrueba = r.data && r.data._id;
  r = await api('PUT', `/api/productos/${idPrueba}`, {
    rol: 'auxiliar',
    body: { existencia: 999, precioVenta: 11 },
  });
  ok(
    r.status === 200 && r.data.existencia === 5 && r.data.precioVenta === 11,
    'PUT no cambia existencia pero sí el precio'
  );
  r = await api('PUT', `/api/productos/${idPrueba}`, {
    rol: 'admin',
    body: { enOferta: true, precioOferta: 20 },
  });
  ok(r.status === 400, 'precio de oferta mayor al de venta -> 400');
  r = await api('PUT', `/api/productos/${idPrueba}`, {
    rol: 'admin',
    body: { enOferta: true, precioOferta: 9 },
  });
  ok(r.status === 200 && r.data.enOferta === true, 'administrador marca oferta');
  r = await api('POST', '/api/productos', { rol: 'admin', body: { ...nuevo, codigo: 'T-9001' } });
  ok(r.status === 409, 'código duplicado -> 409');
  r = await api('POST', '/api/productos', { rol: 'admin', body: { nombre: 'incompleto' } });
  ok(r.status === 400 && Array.isArray(r.data.detalles), 'validación de Mongoose -> 400 con detalles');
  r = await api('DELETE', `/api/productos/${idPrueba}`, { rol: 'auxiliar' });
  ok(r.status === 403, 'auxiliar no elimina -> 403');
  r = await api('DELETE', `/api/categorias/${catId}`, { rol: 'admin' });
  ok(r.status === 409, 'no se elimina categoría con productos -> 409');
  r = await api('GET', '/api/productos?bajos=true', { rol: 'admin' });
  ok(
    r.status === 200 && r.data.every((p) => p.existencia <= p.existenciaMinima) && r.data.length >= 3,
    'filtro de existencias bajas'
  );

  console.log('\nClientes y usuarios');
  r = await api('POST', '/api/clientes', {
    rol: 'cajero',
    body: { nombre: 'Cliente', apellidos: 'Prueba', telefono: '444' },
  });
  const clienteId = r.data && r.data._id;
  ok(r.status === 201, 'cajero crea cliente');
  r = await api('PUT', `/api/clientes/${clienteId}`, { rol: 'cajero', body: { telefono: '555' } });
  ok(r.status === 403, 'cajero no edita clientes -> 403');
  r = await api('GET', '/api/clientes', { rol: 'auxiliar' });
  ok(r.status === 403, 'auxiliar no ve clientes -> 403');
  r = await api('GET', '/api/usuarios', { rol: 'cajero' });
  ok(r.status === 403, 'cajero no ve usuarios -> 403');
  r = await api('GET', '/api/usuarios', { rol: 'admin' });
  const yo = r.data.find((u) => u.correo === 'admin@laesquina.com');
  ok(r.status === 200 && r.data.length === 3, 'administrador lista usuarios');
  r = await api('DELETE', `/api/usuarios/${yo._id}`, { rol: 'admin' });
  ok(r.status === 400, 'no puede eliminarse a sí mismo -> 400');
  r = await api('PUT', `/api/usuarios/${yo._id}`, { rol: 'admin', body: { activo: false } });
  ok(r.status === 400, 'no puede desactivarse a sí mismo -> 400');
  r = await api('POST', '/api/usuarios', {
    rol: 'admin',
    body: {
      nombre: 'Nuevo',
      apellidos: 'Usuario',
      correo: 'nuevo@laesquina.com',
      contrasena: 'Nuevo1234',
      rol: 'auxiliar',
    },
  });
  const nuevoUsuario = r.data && r.data._id;
  ok(r.status === 201 && r.data.contrasena === undefined, 'crea usuario sin exponer contraseña');
  r = await api('POST', '/api/auth/login', {
    body: { correo: 'nuevo@laesquina.com', contrasena: 'Nuevo1234' },
  });
  ok(r.status === 200, 'el usuario nuevo puede iniciar sesión (contraseña encriptada)');
  r = await api('PUT', `/api/usuarios/${nuevoUsuario}`, { rol: 'admin', body: { activo: false } });
  ok(r.status === 200 && r.data.activo === false, 'desactivar usuario');
  r = await api('POST', '/api/auth/login', {
    body: { correo: 'nuevo@laesquina.com', contrasena: 'Nuevo1234' },
  });
  ok(r.status === 403, 'usuario desactivado no entra -> 403');

  console.log('\nTurno y ventas (cajero)');
  r = await api('GET', '/api/turnos/actual', { rol: 'cajero' });
  ok(r.status === 200 && r.data === null, 'sin turno abierto -> null');
  r = await api('POST', '/api/ventas', {
    rol: 'cajero',
    body: { renglones: [{ producto: arroz._id, cantidad: 1 }], pagoRecibido: 100 },
  });
  ok(r.status === 409, 'vender sin turno -> 409');
  r = await api('POST', '/api/turnos/abrir', { rol: 'cajero', body: { fondoInicial: 500 } });
  const turno = r.data;
  ok((r.status === 201 || r.status === 200) && turno.estado === 'abierto', 'abrir turno');
  r = await api('POST', '/api/turnos/abrir', { rol: 'cajero', body: { fondoInicial: 1 } });
  ok(r.status === 409, 'segundo turno abierto -> 409');
  r = await api('POST', '/api/ventas', {
    rol: 'auxiliar',
    body: { renglones: [{ producto: arroz._id, cantidad: 1 }], pagoRecibido: 100 },
  });
  ok(r.status === 403, 'auxiliar no vende -> 403');
  r = await api('POST', '/api/ventas', {
    rol: 'cajero',
    body: { renglones: [{ producto: detergente._id, cantidad: 1 }], pagoRecibido: 100 },
  });
  ok(
    r.status === 400 && /Detergente/.test(r.data.mensaje),
    'sin existencia -> 400 con el nombre del producto',
    `(${r.status}: ${r.data && r.data.mensaje})`
  );
  r = await api('POST', '/api/ventas', {
    rol: 'cajero',
    body: { renglones: [{ producto: arroz._id, cantidad: 1 }], pagoRecibido: 5 },
  });
  ok(r.status === 400, 'pago insuficiente -> 400');
  r = await api('POST', '/api/ventas', {
    rol: 'cajero',
    body: {
      cliente: clienteId,
      renglones: [
        { producto: aceite._id, cantidad: 2 },
        { producto: arroz._id, cantidad: 1 },
      ],
      pagoRecibido: 200,
    },
  });
  const venta = r.data;
  ok(
    r.status === 201 && /^V-\d{6}$/.test(venta.folio),
    'registrar venta con folio V-000001',
    `(${r.status}, ${venta && venta.folio})`
  );
  ok(
    venta && casi(venta.total, 2 * 35 + 32.9) && casi(venta.cambio, 200 - 102.9),
    'total usa precio de oferta (2x35 + 32.90 = 102.90) y cambio 97.10',
    `(total=${venta && venta.total}, cambio=${venta && venta.cambio})`
  );
  r = await api('GET', `/api/productos/${aceite._id}`, { rol: 'cajero' });
  ok(
    r.data.existencia === aceite.existencia - 2,
    'existencia descontada (24 -> 22)',
    `(${r.data.existencia})`
  );
  r = await api('GET', '/api/turnos/actual', { rol: 'cajero' });
  ok(casi(r.data.totalVendido, 102.9) && r.data.numeroTickets === 1, 'turno acumula total y tickets');
  r = await api('GET', `/api/inventario/movimientos?tipo=venta&venta=${venta._id}`, { rol: 'auxiliar' });
  ok(
    r.status === 200 && r.data.filter((m) => m.venta && (m.venta._id || m.venta) == venta._id).length === 2,
    'dos movimientos tipo venta'
  );
  r = await api('GET', '/api/ventas', { rol: 'cajero' });
  ok(
    r.status === 200 && r.data.length === 1 && r.data[0].cliente && r.data[0].cliente.nombre === 'Cliente',
    'cajero lista sus ventas con cliente poblado'
  );
  r = await api('PUT', `/api/ventas/${venta._id}/cancelar`, { rol: 'auxiliar' });
  ok(r.status === 403, 'auxiliar no cancela -> 403');
  r = await api('PUT', `/api/ventas/${venta._id}/cancelar`, { rol: 'cajero' });
  ok(r.status === 200 && r.data.estado === 'cancelada', 'cajero cancela venta de su turno');
  r = await api('PUT', `/api/ventas/${venta._id}/cancelar`, { rol: 'cajero' });
  ok(r.status === 409, 'cancelar dos veces -> 409');
  r = await api('GET', `/api/productos/${aceite._id}`, { rol: 'cajero' });
  ok(r.data.existencia === aceite.existencia, 'existencia devuelta al cancelar (22 -> 24)');
  r = await api('GET', '/api/turnos/actual', { rol: 'cajero' });
  ok(casi(r.data.totalVendido, 0) && r.data.numeroTickets === 0, 'turno descuenta la venta cancelada');
  r = await api('POST', '/api/ventas', {
    rol: 'cajero',
    body: { renglones: [{ producto: arroz._id, cantidad: 3 }], pagoRecibido: 100 },
  });
  const venta2 = r.data;
  ok(
    r.status === 201 && venta2.folio === 'V-000002' && venta2.cliente === null,
    'segunda venta, folio consecutivo, público en general'
  );

  console.log('\nInventario (auxiliar)');
  r = await api('POST', '/api/inventario/movimientos', {
    rol: 'cajero',
    body: { producto: detergente._id, tipo: 'entrada', cantidad: 10 },
  });
  ok(r.status === 403, 'cajero no registra movimientos -> 403');
  r = await api('POST', '/api/inventario/movimientos', {
    rol: 'auxiliar',
    body: { producto: detergente._id, tipo: 'entrada', cantidad: 10, proveedor: provId, motivo: 'Compra' },
  });
  ok(r.status === 201 && r.data.existenciaAnterior === 0 && r.data.existenciaNueva === 10, 'entrada 0 -> 10');
  r = await api('POST', '/api/inventario/movimientos', {
    rol: 'auxiliar',
    body: { producto: detergente._id, tipo: 'merma', cantidad: 3, motivo: 'Caducado' },
  });
  ok(r.status === 201 && r.data.existenciaNueva === 7, 'merma 10 -> 7');
  r = await api('POST', '/api/inventario/movimientos', {
    rol: 'auxiliar',
    body: { producto: detergente._id, tipo: 'salida', cantidad: 20, motivo: 'x' },
  });
  ok(r.status === 400, 'salida mayor a la existencia -> 400');
  r = await api('POST', '/api/inventario/movimientos', {
    rol: 'auxiliar',
    body: { producto: detergente._id, tipo: 'venta', cantidad: 1 },
  });
  ok(r.status === 400, 'tipo venta manual -> 400');
  r = await api('GET', '/api/inventario/bajos', { rol: 'auxiliar' });
  ok(r.status === 200 && Array.isArray(r.data), 'existencias bajas');

  console.log('\nCorte de caja y reportes');
  r = await api('PUT', `/api/turnos/${turno._id}/cerrar`, { rol: 'auxiliar', body: { efectivoContado: 1 } });
  ok(r.status === 403, 'auxiliar no cierra turnos -> 403');
  r = await api('PUT', `/api/turnos/${turno._id}/cerrar`, { rol: 'cajero', body: { efectivoContado: 590 } });
  ok(
    r.status === 200 &&
      r.data.estado === 'cerrado' &&
      casi(r.data.efectivoEsperado, 500 + 3 * 32.9) &&
      casi(r.data.diferencia, 590 - 598.7),
    'cerrar turno: esperado 598.70, diferencia -8.70',
    `(${r.status}, esperado=${r.data && r.data.efectivoEsperado}, dif=${r.data && r.data.diferencia})`
  );
  r = await api('PUT', `/api/turnos/${turno._id}/cerrar`, { rol: 'cajero', body: { efectivoContado: 1 } });
  ok(r.status === 409, 'cerrar dos veces -> 409');
  r = await api('PUT', `/api/ventas/${venta2._id}/cancelar`, { rol: 'cajero' });
  ok(r.status === 403 || r.status === 409, 'cajero no cancela ventas de un turno cerrado');
  r = await api('GET', '/api/turnos', { rol: 'admin' });
  ok(
    r.status === 200 && r.data.length === 1 && r.data[0].usuario.nombre,
    'administrador ve historial de turnos'
  );
  r = await api('GET', '/api/reportes/ventas', { rol: 'cajero' });
  ok(r.status === 403, 'cajero no ve reportes -> 403');
  r = await api('GET', '/api/reportes/ventas', { rol: 'admin' });
  ok(
    r.status === 200 &&
      r.data.numeroTickets === 1 &&
      casi(r.data.totalVentas, 98.7) &&
      r.data.porDia.length === 1,
    'reporte de ventas (1 ticket, $98.70, sin la cancelada)',
    `(${JSON.stringify(r.data).slice(0, 120)})`
  );
  r = await api('GET', '/api/reportes/productos-mas-vendidos', { rol: 'admin' });
  ok(
    r.status === 200 && r.data[0] && r.data[0].nombre === 'Arroz 1 kg' && r.data[0].cantidad === 3,
    'productos más vendidos'
  );
  r = await api('GET', '/api/reportes/ventas-por-categoria', { rol: 'admin' });
  ok(r.status === 200 && r.data[0] && r.data[0].nombre === 'Abarrotes', 'ventas por categoría');

  console.log(`\n${pasan} pruebas pasan, ${fallan} fallan`);
  process.exit(fallan ? 1 : 0);
}

main().catch((err) => {
  console.error('Error al ejecutar las pruebas:', err.message);
  process.exit(1);
});
