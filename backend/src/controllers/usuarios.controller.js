const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Usuario, Turno, Venta, MovimientoInventario } = require('../models');

const buscarUsuario = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');
  return usuario;
};

const esElMismo = (usuario, req) => usuario._id.equals(req.usuario._id);

const listar = asyncHandler(async (req, res) => {
  const { rol, activo } = req.query;
  const filtro = {};
  if (rol) filtro.rol = rol;
  if (activo === 'true' || activo === 'false') filtro.activo = activo === 'true';

  const usuarios = await Usuario.find(filtro).sort('apellidos nombre');
  res.json(usuarios);
});

const obtener = asyncHandler(async (req, res) => {
  res.json(await buscarUsuario(req.params.id));
});

const crear = asyncHandler(async (req, res) => {
  const { nombre, apellidos, correo, contrasena, rol } = req.body;
  const usuario = await Usuario.create({ nombre, apellidos, correo, contrasena, rol });
  res.status(201).json(usuario);
});

const actualizar = asyncHandler(async (req, res) => {
  const { nombre, apellidos, correo, rol, activo, contrasena } = req.body;
  const usuario = await buscarUsuario(req.params.id);

  if (nombre !== undefined) usuario.nombre = nombre;
  if (apellidos !== undefined) usuario.apellidos = apellidos;
  if (correo !== undefined) usuario.correo = correo;
  if (rol !== undefined && rol !== usuario.rol && esElMismo(usuario, req)) {
    throw new ApiError(400, 'No puedes cambiar tu propio rol');
  }
  if (rol !== undefined) usuario.rol = rol;
  if (activo !== undefined) usuario.activo = activo;
  if (contrasena) usuario.contrasena = contrasena;

  if (activo !== undefined && usuario.activo === false && esElMismo(usuario, req)) {
    throw new ApiError(400, 'No puedes desactivar tu propia cuenta');
  }

  await usuario.save();
  res.json(usuario);
});

const eliminar = asyncHandler(async (req, res) => {
  const usuario = await buscarUsuario(req.params.id);
  if (esElMismo(usuario, req)) throw new ApiError(400, 'No puedes eliminar tu propia cuenta');

  const [tieneTurnos, tieneVentas, tieneMovimientos] = await Promise.all([
    Turno.exists({ usuario: usuario._id }),
    Venta.exists({ usuario: usuario._id }),
    MovimientoInventario.exists({ usuario: usuario._id }),
  ]);

  if (tieneTurnos || tieneVentas || tieneMovimientos) {
    usuario.activo = false;
    await usuario.save();
    return res.json({
      mensaje: 'El usuario tiene turnos, ventas o movimientos registrados; se marcó como inactivo',
    });
  }

  await usuario.deleteOne();
  res.json({ mensaje: 'Usuario eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
