const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { rangoFechas } = require('../utils/fechas');
const { Venta, Producto, Turno, Cliente, MovimientoInventario } = require('../models');

const POPULATE = [
  { path: 'cliente', select: 'nombre apellidos' },
  { path: 'usuario', select: 'nombre apellidos' },
];

const esAdmin = (usuario) => usuario.rol === 'administrador';
const esDueno = (venta, usuario) => {
  const id = venta.usuario && venta.usuario._id ? venta.usuario._id : venta.usuario;
  return String(id) === String(usuario._id);
};
const redondear = (n) => Math.round(n * 100) / 100;

const generarFolio = async () => `V-${String((await Venta.countDocuments()) + 1).padStart(6, '0')}`;

const crearConFolio = async (datos) => {
  try {
    return await Venta.create({ ...datos, folio: await generarFolio() });
  } catch (err) {
    if (err.code !== 11000) throw err;
    return Venta.create({ ...datos, folio: await generarFolio() });
  }
};

const moverExistencia = async (producto, cantidad, tipo, venta, usuarioId) => {
  const existenciaNueva = producto.existencia + cantidad;
  await Producto.updateOne({ _id: producto._id }, { $inc: { existencia: cantidad } });
  await MovimientoInventario.create({
    producto: producto._id,
    tipo,
    cantidad: Math.abs(cantidad),
    existenciaAnterior: producto.existencia,
    existenciaNueva,
    motivo: tipo === 'venta' ? `Venta ${venta.folio}` : `Cancelación de venta ${venta.folio}`,
    venta: venta._id,
    usuario: usuarioId,
  });
};

const registrar = asyncHandler(async (req, res) => {
  const { cliente, renglones, pagoRecibido } = req.body;
  if (!Array.isArray(renglones) || renglones.length === 0)
    throw new ApiError(400, 'La venta debe tener al menos un producto');
  const pago = Number(pagoRecibido);
  if (
    pagoRecibido === undefined ||
    pagoRecibido === null ||
    pagoRecibido === '' ||
    !Number.isFinite(pago) ||
    pago < 0
  ) {
    throw new ApiError(400, 'El pago recibido es obligatorio y debe ser un número mayor o igual a cero');
  }

  const turno = await Turno.findOne({ usuario: req.usuario._id, estado: 'abierto' });
  if (!turno) throw new ApiError(409, 'Necesitas un turno abierto para registrar ventas');

  if (cliente && !(await Cliente.exists({ _id: cliente })))
    throw new ApiError(400, 'El cliente indicado no existe');

  const cantidades = new Map();
  for (const r of renglones) {
    if (!r || !r.producto) throw new ApiError(400, 'Cada renglón debe indicar el producto y la cantidad');
    const id = String(r.producto);
    cantidades.set(id, (cantidades.get(id) || 0) + Number(r.cantidad));
  }

  const detalle = [];
  let total = 0;
  for (const [id, cantidad] of cantidades) {
    if (!Number.isInteger(cantidad) || cantidad < 1)
      throw new ApiError(400, 'La cantidad de cada producto debe ser un entero mayor a cero');
    const producto = await Producto.findById(id);
    if (!producto || !producto.activo)
      throw new ApiError(400, 'Uno de los productos no existe o está inactivo');
    if (producto.existencia < cantidad) {
      throw new ApiError(
        400,
        `Existencia insuficiente de "${producto.nombre}": hay ${producto.existencia} y se pidieron ${cantidad}`
      );
    }
    const precioUnitario =
      producto.enOferta && producto.precioOferta ? producto.precioOferta : producto.precioVenta;
    const subtotal = redondear(precioUnitario * cantidad);
    total = redondear(total + subtotal);
    detalle.push({ producto: producto._id, nombre: producto.nombre, cantidad, precioUnitario, subtotal });
  }

  if (pago < total) throw new ApiError(400, `El pago recibido ($${pago}) es menor que el total ($${total})`);

  const descontados = [];
  for (const d of detalle) {
    const p = await Producto.findOneAndUpdate(
      { _id: d.producto, activo: true, existencia: { $gte: d.cantidad } },
      { $inc: { existencia: -d.cantidad } },
      { new: true }
    );
    if (!p) {
      for (const x of descontados)
        await Producto.updateOne({ _id: x.producto }, { $inc: { existencia: x.cantidad } });
      throw new ApiError(400, `Existencia insuficiente de "${d.nombre}"`);
    }
    descontados.push({ ...d, existenciaNueva: p.existencia });
  }

  let venta;
  try {
    venta = await crearConFolio({
      turno: turno._id,
      usuario: req.usuario._id,
      cliente: cliente || null,
      renglones: detalle,
      total,
      pagoRecibido: pago,
      cambio: redondear(pago - total),
    });
  } catch (err) {
    for (const x of descontados)
      await Producto.updateOne({ _id: x.producto }, { $inc: { existencia: x.cantidad } });
    throw err;
  }

  for (const x of descontados) {
    await MovimientoInventario.create({
      producto: x.producto,
      tipo: 'venta',
      cantidad: x.cantidad,
      existenciaAnterior: x.existenciaNueva + x.cantidad,
      existenciaNueva: x.existenciaNueva,
      motivo: `Venta ${venta.folio}`,
      venta: venta._id,
      usuario: req.usuario._id,
    });
  }

  turno.totalVendido = redondear(turno.totalVendido + total);
  turno.numeroTickets += 1;
  await turno.save();

  res.status(201).json(await venta.populate(POPULATE));
});

const listar = asyncHandler(async (req, res) => {
  const { turno, desde, hasta, limite } = req.query;
  const filtro = {};
  if (!esAdmin(req.usuario)) filtro.usuario = req.usuario._id;
  if (turno) filtro.turno = turno;
  if (desde || hasta) filtro.fecha = rangoFechas(desde, hasta);

  const consulta = Venta.find(filtro).sort('-fecha').populate(POPULATE);
  const n = parseInt(limite, 10);
  if (n > 0) consulta.limit(n);

  res.json(await consulta);
});

const obtener = asyncHandler(async (req, res) => {
  const venta = await Venta.findById(req.params.id).populate(POPULATE);
  if (!venta) throw new ApiError(404, 'Venta no encontrada');
  if (!esAdmin(req.usuario) && !esDueno(venta, req.usuario))
    throw new ApiError(403, 'Sólo puedes ver tus propias ventas');
  res.json(venta);
});

const cancelar = asyncHandler(async (req, res) => {
  const venta = await Venta.findById(req.params.id);
  if (!venta) throw new ApiError(404, 'Venta no encontrada');
  if (venta.estado === 'cancelada') throw new ApiError(409, 'La venta ya está cancelada');

  const turno = await Turno.findById(venta.turno);
  if (!esAdmin(req.usuario)) {
    if (!esDueno(venta, req.usuario))
      throw new ApiError(403, 'Sólo puedes cancelar ventas de tu propio turno');
    if (!turno || turno.estado !== 'abierto')
      throw new ApiError(409, 'El turno de esta venta ya está cerrado');
  }

  const marcada = await Venta.findOneAndUpdate(
    { _id: venta._id, estado: 'registrada' },
    { estado: 'cancelada' }
  );
  if (!marcada) throw new ApiError(409, 'La venta ya está cancelada');
  venta.estado = 'cancelada';

  for (const r of venta.renglones) {
    const producto = await Producto.findById(r.producto);
    if (producto) await moverExistencia(producto, r.cantidad, 'cancelacion', venta, req.usuario._id);
  }

  if (turno && turno.estado === 'abierto') {
    turno.totalVendido = redondear(turno.totalVendido - venta.total);
    turno.numeroTickets = Math.max(0, turno.numeroTickets - 1);
    await turno.save();
  }

  res.json(await venta.populate(POPULATE));
});

module.exports = { registrar, listar, obtener, cancelar };
