const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Turno } = require('../models');

const POPULATE_USUARIO = ['usuario', 'nombre apellidos'];

const aMonto = (valor) => {
  if (typeof valor !== 'number' && (typeof valor !== 'string' || valor.trim() === '')) return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const redondear = (n) => Math.round(n * 100) / 100;

const esDueno = (turno, usuario) => {
  const dueno = turno.usuario && turno.usuario._id ? turno.usuario._id : turno.usuario;
  return dueno != null && String(dueno) === String(usuario._id);
};

const esAdmin = (usuario) => usuario.rol === 'administrador';

const buscarTurno = async (id) => {
  const turno = await Turno.findById(id).populate(...POPULATE_USUARIO);
  if (!turno) throw new ApiError(404, 'Turno no encontrado');
  return turno;
};

const actual = asyncHandler(async (req, res) => {
  const turno = await Turno.findOne({ usuario: req.usuario._id, estado: 'abierto' }).populate(
    ...POPULATE_USUARIO
  );
  res.json(turno);
});

const abrir = asyncHandler(async (req, res) => {
  const fondoInicial = aMonto(req.body.fondoInicial);
  if (fondoInicial === null)
    throw new ApiError(400, 'El fondo inicial debe ser un número mayor o igual a cero');

  const abierto = await Turno.exists({ usuario: req.usuario._id, estado: 'abierto' });
  if (abierto) throw new ApiError(409, 'Ya tienes un turno abierto; ciérralo antes de abrir otro');

  const turno = await Turno.create({ usuario: req.usuario._id, fondoInicial });
  await turno.populate(...POPULATE_USUARIO);
  res.status(201).json(turno);
});

const cerrar = asyncHandler(async (req, res) => {
  const turno = await buscarTurno(req.params.id);

  if (!esAdmin(req.usuario) && !esDueno(turno, req.usuario)) {
    throw new ApiError(403, 'Sólo puedes cerrar tu propio turno');
  }
  if (turno.estado === 'cerrado') throw new ApiError(409, 'El turno ya está cerrado');

  const efectivoContado = aMonto(req.body.efectivoContado);
  if (efectivoContado === null)
    throw new ApiError(400, 'El efectivo contado debe ser un número mayor o igual a cero');

  const efectivoEsperado = redondear(turno.fondoInicial + (turno.totalVendido || 0));
  const diferencia = redondear(efectivoContado - efectivoEsperado);

  const cerrado = await Turno.findByIdAndUpdate(
    turno._id,
    { efectivoContado, efectivoEsperado, diferencia, fechaCierre: new Date(), estado: 'cerrado' },
    { new: true, runValidators: true }
  ).populate(...POPULATE_USUARIO);

  res.json(cerrado);
});

const listar = asyncHandler(async (req, res) => {
  const { usuario, estado } = req.query;
  const filtro = {};

  if (esAdmin(req.usuario)) {
    if (usuario) filtro.usuario = usuario;
  } else {
    filtro.usuario = req.usuario._id;
  }
  if (estado) filtro.estado = estado;

  const turnos = await Turno.find(filtro)
    .populate(...POPULATE_USUARIO)
    .sort('-fechaApertura');
  res.json(turnos);
});

const obtener = asyncHandler(async (req, res) => {
  const turno = await buscarTurno(req.params.id);
  if (!esAdmin(req.usuario) && !esDueno(turno, req.usuario)) {
    throw new ApiError(403, 'Sólo puedes ver tus propios turnos');
  }
  res.json(turno);
});

module.exports = { actual, abrir, cerrar, listar, obtener };
