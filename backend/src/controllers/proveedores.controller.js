const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Proveedor, Producto } = require('../models');

const CAMPOS_EDITABLES = ['nombre', 'contacto', 'telefono', 'correo', 'direccion', 'activo'];

const tomarCampos = (body) =>
  CAMPOS_EDITABLES.reduce((datos, campo) => {
    if (body[campo] !== undefined) datos[campo] = body[campo];
    return datos;
  }, {});

const listar = asyncHandler(async (req, res) => {
  const { activos, buscar } = req.query;
  const filtro = {};
  if (activos === 'true') filtro.activo = true;
  if (typeof buscar === 'string' && buscar.trim()) {
    const texto = buscar.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filtro.nombre = { $regex: texto, $options: 'i' };
  }

  const proveedores = await Proveedor.find(filtro).sort('nombre');
  res.json(proveedores);
});

const obtener = asyncHandler(async (req, res) => {
  const proveedor = await Proveedor.findById(req.params.id);
  if (!proveedor) throw new ApiError(404, 'Proveedor no encontrado');
  res.json(proveedor);
});

const crear = asyncHandler(async (req, res) => {
  const proveedor = await Proveedor.create(tomarCampos(req.body));
  res.status(201).json(proveedor);
});

const actualizar = asyncHandler(async (req, res) => {
  const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, tomarCampos(req.body), {
    new: true,
    runValidators: true,
  });
  if (!proveedor) throw new ApiError(404, 'Proveedor no encontrado');
  res.json(proveedor);
});

const eliminar = asyncHandler(async (req, res) => {
  const proveedor = await Proveedor.findById(req.params.id);
  if (!proveedor) throw new ApiError(404, 'Proveedor no encontrado');

  const productos = await Producto.countDocuments({ proveedor: proveedor._id });
  if (productos > 0) {
    throw new ApiError(409, `No se puede eliminar: el proveedor tiene ${productos} producto(s) asociado(s)`);
  }

  await proveedor.deleteOne();
  res.json({ mensaje: 'Proveedor eliminado correctamente' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
