const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Producto, Venta, MovimientoInventario } = require('../models');

const CAMPOS_BASE = [
  'codigo',
  'nombre',
  'descripcion',
  'categoria',
  'proveedor',
  'precioVenta',
  'precioCompra',
  'unidadMedida',
  'existencia',
  'existenciaMinima',
  'imagen',
];
const CAMPOS_ADMIN = ['enOferta', 'precioOferta', 'activo'];

const POBLAR = [
  { path: 'categoria', select: 'nombre' },
  { path: 'proveedor', select: 'nombre' },
];
const poblar = (consultaODoc) => consultaODoc.populate(POBLAR);

const tomarDatos = (body, usuario, esCreacion) => {
  const permitidos = CAMPOS_BASE.filter((c) => esCreacion || c !== 'existencia');
  if (usuario.rol === 'administrador') permitidos.push(...CAMPOS_ADMIN);

  const datos = {};
  for (const campo of permitidos) if (body[campo] !== undefined) datos[campo] = body[campo];
  return datos;
};

const validarOferta = ({ enOferta, precioOferta, precioVenta }) => {
  if (!enOferta) return;
  if (precioOferta === undefined || precioOferta === null || precioOferta === '') {
    throw new ApiError(400, 'El precio de oferta es obligatorio cuando el producto está en oferta');
  }
  if (Number(precioOferta) >= Number(precioVenta)) {
    throw new ApiError(400, 'El precio de oferta debe ser menor que el precio de venta');
  }
};

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listar = asyncHandler(async (req, res) => {
  const { buscar, categoria, bajos, activos } = req.query;
  const filtro = {};
  if (activos === 'true') filtro.activo = true;

  if (categoria) filtro.categoria = categoria;
  if (typeof buscar === 'string' && buscar.trim()) {
    const regex = { $regex: escaparRegex(buscar.trim()), $options: 'i' };
    filtro.$or = [{ nombre: regex }, { codigo: regex }];
  }
  if (bajos === 'true') filtro.$expr = { $lte: ['$existencia', '$existenciaMinima'] };

  const productos = await poblar(Producto.find(filtro)).sort('nombre');
  res.json(productos);
});

const obtener = asyncHandler(async (req, res) => {
  const producto = await poblar(Producto.findById(req.params.id));
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.json(producto);
});

const crear = asyncHandler(async (req, res) => {
  const datos = tomarDatos(req.body, req.usuario, true);
  if (!datos.enOferta) datos.precioOferta = null;
  validarOferta(datos);

  const producto = await Producto.create(datos);
  await poblar(producto);
  res.status(201).json(producto);
});

const actualizar = asyncHandler(async (req, res) => {
  const actual = await Producto.findById(req.params.id);
  if (!actual) throw new ApiError(404, 'Producto no encontrado');

  const datos = tomarDatos(req.body, req.usuario, false);
  if (datos.enOferta === false) datos.precioOferta = null;

  validarOferta({ ...actual.toObject(), ...datos });

  const producto = await poblar(
    Producto.findByIdAndUpdate(req.params.id, datos, { new: true, runValidators: true })
  );
  res.json(producto);
});

const eliminar = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  const [tieneVentas, tieneMovimientos] = await Promise.all([
    Venta.exists({ 'renglones.producto': producto._id }),
    MovimientoInventario.exists({ producto: producto._id }),
  ]);
  if (tieneVentas || tieneMovimientos) {
    await Producto.findByIdAndUpdate(producto._id, { activo: false }, { new: true, runValidators: true });
    return res.json({
      mensaje: 'El producto tiene ventas o movimientos de inventario registrados; se marcó como inactivo',
    });
  }

  await producto.deleteOne();
  res.json({ mensaje: 'Producto eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
