const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Cliente } = require('../models');

const CAMPOS_PERMITIDOS = ['nombre', 'apellidos', 'telefono', 'correo'];

const tomarDatos = (body) =>
  CAMPOS_PERMITIDOS.reduce((datos, campo) => {
    if (body[campo] !== undefined) datos[campo] = body[campo];
    return datos;
  }, {});

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listar = asyncHandler(async (req, res) => {
  const { buscar } = req.query;
  const filtro = {};
  if (typeof buscar === 'string' && buscar.trim()) {
    const regex = { $regex: escaparRegex(buscar.trim()), $options: 'i' };
    filtro.$or = [{ nombre: regex }, { apellidos: regex }, { telefono: regex }];
  }

  const clientes = await Cliente.find(filtro).sort('nombre apellidos');
  res.json(clientes);
});

const obtener = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');
  res.json(cliente);
});

const crear = asyncHandler(async (req, res) => {
  const cliente = await Cliente.create(tomarDatos(req.body));
  res.status(201).json(cliente);
});

const actualizar = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findByIdAndUpdate(req.params.id, tomarDatos(req.body), {
    new: true,
    runValidators: true,
  });
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');
  res.json(cliente);
});

const eliminar = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findByIdAndDelete(req.params.id);
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');
  res.json({ mensaje: 'Cliente eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
