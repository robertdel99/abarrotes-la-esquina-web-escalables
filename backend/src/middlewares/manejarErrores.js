const manejarErrores = (err, req, res, next) => {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';
  let detalles = err.detalles;

  if (err.name === 'ValidationError') {
    status = 400;
    mensaje = 'Datos inválidos';
    detalles = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400;
    mensaje = `Identificador inválido: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    const campo = Object.keys(err.keyValue || {})[0] || 'valor';
    mensaje = `Ya existe un registro con ese ${campo}`;
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    mensaje = 'La sesión expiró, inicia sesión de nuevo';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    mensaje = 'Token inválido';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es JSON válido';
  }

  if (status >= 500) {
    console.error(err);
    mensaje = 'Error interno del servidor';
    detalles = undefined;
  }
  res.status(status).json({ mensaje, ...(detalles && { detalles }) });
};

module.exports = manejarErrores;
