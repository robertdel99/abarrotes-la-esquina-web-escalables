const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const Usuario = require('../models/Usuario');

const autenticar = async (req, res, next) => {
  try {
    const encabezado = req.headers.authorization || '';
    const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;
    if (!token) throw new ApiError(401, 'Se requiere iniciar sesión');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.id);
    if (!usuario || !usuario.activo) throw new ApiError(401, 'La sesión ya no es válida');

    req.usuario = usuario;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = autenticar;
