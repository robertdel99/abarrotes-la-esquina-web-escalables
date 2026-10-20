const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Usuario = require('../models/Usuario');

const firmarToken = (usuario) =>
  jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRA || '8h',
  });

const login = asyncHandler(async (req, res) => {
  const { correo, contrasena } = req.body;
  if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo.trim() || !contrasena)
    throw new ApiError(400, 'Correo y contraseña son obligatorios');

  const usuario = await Usuario.findOne({ correo: correo.toLowerCase().trim() }).select('+contrasena');
  const valida = usuario && (await usuario.compararContrasena(contrasena));
  if (!valida) throw new ApiError(401, 'Correo o contraseña incorrectos');
  if (!usuario.activo) throw new ApiError(403, 'Tu cuenta está desactivada, contacta al administrador');

  res.json({ token: firmarToken(usuario), usuario });
});

const perfil = asyncHandler(async (req, res) => {
  res.json(req.usuario);
});

const actualizarPerfil = asyncHandler(async (req, res) => {
  const { nombre, apellidos, correo, contrasena, contrasenaActual } = req.body;
  const usuario = await Usuario.findById(req.usuario._id).select('+contrasena');

  if (nombre !== undefined) usuario.nombre = nombre;
  if (apellidos !== undefined) usuario.apellidos = apellidos;
  if (correo !== undefined) usuario.correo = correo;

  if (contrasena) {
    if (!contrasenaActual || !(await usuario.compararContrasena(contrasenaActual))) {
      throw new ApiError(400, 'La contraseña actual no es correcta');
    }
    usuario.contrasena = contrasena;
  }

  await usuario.save();
  res.json(usuario);
});

module.exports = { login, perfil, actualizarPerfil };
