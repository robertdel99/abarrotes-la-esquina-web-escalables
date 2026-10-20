const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsearFecha, finDeDia } = require('../utils/fechas');
const { MovimientoInventario, Producto, Proveedor } = require('../models');

const TIPOS_MANUALES = ['entrada', 'salida', 'merma'];

const POPULATE_MOVIMIENTO = [
  { path: 'producto', select: 'codigo nombre' },
  { path: 'usuario', select: 'nombre apellidos' },
  { path: 'proveedor', select: 'nombre' },
];

const listarMovimientos = asyncHandler(async (req, res) => {
  const { producto, tipo, desde, hasta, limite } = req.query;

  const filtro = {};
  if (producto) filtro.producto = producto;
  if (tipo) {
    if (!MovimientoInventario.TIPOS.includes(tipo)) throw new ApiError(400, 'Tipo de movimiento no válido');
    filtro.tipo = tipo;
  }
  if (desde || hasta) {
    filtro.fecha = {};
    if (desde) filtro.fecha.$gte = parsearFecha(desde, 'desde');
    if (hasta) filtro.fecha.$lte = finDeDia(hasta, 'hasta');
  }

  const maximo = Number(limite) > 0 ? Math.floor(Number(limite)) : 200;

  const movimientos = await MovimientoInventario.find(filtro)
    .sort({ fecha: -1 })
    .limit(maximo)
    .populate(POPULATE_MOVIMIENTO);
  res.json(movimientos);
});

const registrarMovimiento = asyncHandler(async (req, res) => {
  const { producto: productoId, tipo, cantidad, motivo, proveedor } = req.body;

  if (!productoId) throw new ApiError(400, 'El producto es obligatorio');
  if (!TIPOS_MANUALES.includes(tipo)) {
    throw new ApiError(400, 'El tipo debe ser entrada, salida o merma');
  }
  const unidades = Number(cantidad);
  if (!Number.isInteger(unidades) || unidades <= 0) {
    throw new ApiError(400, 'La cantidad debe ser un número entero mayor que cero');
  }

  const producto = await Producto.findById(productoId);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  let proveedorId = null;
  if (tipo === 'entrada' && proveedor) {
    if (!(await Proveedor.exists({ _id: proveedor }))) throw new ApiError(404, 'Proveedor no encontrado');
    proveedorId = proveedor;
  }

  const delta = tipo === 'entrada' ? unidades : -unidades;
  if (producto.existencia + delta < 0) {
    throw new ApiError(
      400,
      `Existencia insuficiente de "${producto.nombre}": hay ${producto.existencia} y se quieren retirar ${unidades}`
    );
  }

  const movimiento = new MovimientoInventario({
    producto: producto._id,
    tipo,
    cantidad: unidades,
    existenciaAnterior: producto.existencia,
    existenciaNueva: producto.existencia + delta,
    motivo,
    proveedor: proveedorId,
    usuario: req.usuario._id,
  });
  await movimiento.validate();

  const actualizado = await Producto.findOneAndUpdate(
    { _id: producto._id, ...(delta < 0 && { existencia: { $gte: unidades } }) },
    { $inc: { existencia: delta } },
    { new: true }
  );
  if (!actualizado) throw new ApiError(400, `Existencia insuficiente de "${producto.nombre}"`);

  movimiento.existenciaAnterior = actualizado.existencia - delta;
  movimiento.existenciaNueva = actualizado.existencia;
  await movimiento.save();

  await movimiento.populate(POPULATE_MOVIMIENTO);
  res.status(201).json(movimiento);
});

const listarBajos = asyncHandler(async (req, res) => {
  const productos = await Producto.find({
    activo: true,
    $expr: { $lte: ['$existencia', '$existenciaMinima'] },
  })
    .populate('categoria', 'nombre')
    .populate('proveedor', 'nombre')
    .sort({ existencia: 1, nombre: 1 });
  res.json(productos);
});

module.exports = { listarMovimientos, registrarMovimiento, listarBajos };
