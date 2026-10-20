const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Categoria, Producto } = require('../models');

const tomarDatos = ({ nombre, descripcion, activa }) => {
  const datos = {};
  if (nombre !== undefined) datos.nombre = nombre;
  if (descripcion !== undefined) datos.descripcion = descripcion;
  if (activa !== undefined) datos.activa = activa;
  return datos;
};

const listar = asyncHandler(async (req, res) => {
  const filtro = {};
  if (req.query.activas === 'true') filtro.activa = true;

  const categorias = await Categoria.find(filtro).sort('nombre');
  res.json(categorias);
});

const obtener = asyncHandler(async (req, res) => {
  const categoria = await Categoria.findById(req.params.id);
  if (!categoria) throw new ApiError(404, 'Categoría no encontrada');
  res.json(categoria);
});

const crear = asyncHandler(async (req, res) => {
  const categoria = await Categoria.create(tomarDatos(req.body));
  res.status(201).json(categoria);
});

const actualizar = asyncHandler(async (req, res) => {
  const categoria = await Categoria.findByIdAndUpdate(req.params.id, tomarDatos(req.body), {
    new: true,
    runValidators: true,
  });
  if (!categoria) throw new ApiError(404, 'Categoría no encontrada');
  res.json(categoria);
});

const eliminar = asyncHandler(async (req, res) => {
  const categoria = await Categoria.findById(req.params.id);
  if (!categoria) throw new ApiError(404, 'Categoría no encontrada');

  const productos = await Producto.countDocuments({ categoria: categoria._id });
  if (productos > 0) {
    throw new ApiError(409, `No se puede eliminar: la categoría tiene ${productos} producto(s) asociado(s)`);
  }

  await categoria.deleteOne();
  res.json({ mensaje: 'Categoría eliminada' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
