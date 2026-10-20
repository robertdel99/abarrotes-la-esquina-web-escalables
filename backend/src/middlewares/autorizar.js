const ApiError = require('../utils/ApiError');

const autorizar =
  (...roles) =>
  (req, res, next) => {
    if (!req.usuario) return next(new ApiError(401, 'Se requiere iniciar sesión'));
    if (!roles.includes(req.usuario.rol)) {
      return next(new ApiError(403, 'No tienes permiso para realizar esta acción'));
    }
    next();
  };

module.exports = autorizar;
