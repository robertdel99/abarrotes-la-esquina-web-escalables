const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Producto, Categoria } = require('../models');
const tienda = require('../config/tienda');

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CAMPOS_PUBLICOS =
  'codigo nombre descripcion categoria precioVenta unidadMedida imagen enOferta precioOferta existencia activo';

const aPublico = (p) => {
  const o = p.toObject({ virtuals: true });
  delete o.existencia;
  delete o.existenciaBaja;
  return o;
};

const infoTienda = (req, res) => res.json(tienda);

const listarCategorias = asyncHandler(async (req, res) => {
  const categorias = await Categoria.find({ activa: true }).sort('nombre').select('nombre descripcion');
  res.json(categorias);
});

const listarProductos = asyncHandler(async (req, res) => {
  const { buscar, categoria } = req.query;
  const filtro = { activo: true };
  if (typeof categoria === 'string' && categoria) filtro.categoria = categoria;
  if (typeof buscar === 'string' && buscar.trim())
    filtro.nombre = { $regex: escaparRegex(buscar.trim()), $options: 'i' };

  const productos = await Producto.find(filtro)
    .select(CAMPOS_PUBLICOS)
    .populate('categoria', 'nombre')
    .sort('nombre');
  res.json(productos.map(aPublico));
});

const obtenerProducto = asyncHandler(async (req, res) => {
  const producto = await Producto.findOne({ _id: req.params.id, activo: true })
    .select(CAMPOS_PUBLICOS)
    .populate('categoria', 'nombre');
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.json(aPublico(producto));
});

const listarOfertas = asyncHandler(async (req, res) => {
  const ofertas = await Producto.find({ activo: true, enOferta: true })
    .select(CAMPOS_PUBLICOS)
    .populate('categoria', 'nombre')
    .sort('nombre');
  res.json(ofertas.map(aPublico));
});

module.exports = { infoTienda, listarCategorias, listarProductos, obtenerProducto, listarOfertas };
