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
  const { buscar, categoria, ofertas, disponibles, pagina } = req.query;
  const filtro = { activo: true };
  if (ofertas === 'true') filtro.enOferta = true;
  if (disponibles === 'true') filtro.existencia = { $gt: 0 };
  if (typeof categoria === 'string' && categoria) filtro.categoria = categoria;
  if (typeof buscar === 'string' && buscar.trim())
    filtro.nombre = { $regex: escaparRegex(buscar.trim()), $options: 'i' };

  const consulta = Producto.find(filtro)
    .select(CAMPOS_PUBLICOS)
    .populate('categoria', 'nombre')
    .sort({ nombre: 1, _id: 1 });
  if (pagina === undefined) return res.json((await consulta).map(aPublico));

  const solicitada = Number(pagina);
  if (typeof pagina !== 'string' || !/^\d+$/.test(pagina) || !Number.isSafeInteger(solicitada) || solicitada < 1) {
    throw new ApiError(400, 'La página debe ser un entero positivo');
  }
  const porPagina = 8;
  const total = await Producto.countDocuments(filtro);
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const actual = Math.min(solicitada, paginas);
  const productos = await consulta.skip((actual - 1) * porPagina).limit(porPagina);
  res.json({ productos: productos.map(aPublico), total, pagina: actual, paginas });
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
