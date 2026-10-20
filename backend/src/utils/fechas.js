const ApiError = require('./ApiError');

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const parsearFecha = (texto, nombre = 'fecha') => {
  if (typeof texto !== 'string') throw new ApiError(400, `La fecha "${nombre}" no es válida`);
  const fecha = SOLO_FECHA.test(texto) ? new Date(`${texto}T00:00:00`) : new Date(texto);
  if (Number.isNaN(fecha.getTime())) throw new ApiError(400, `La fecha "${nombre}" no es válida`);
  return fecha;
};

const finDeDia = (texto, nombre = 'hasta') => {
  const fecha = parsearFecha(texto, nombre);
  if (SOLO_FECHA.test(texto)) fecha.setHours(23, 59, 59, 999);
  return fecha;
};

const rangoFechas = (desde, hasta) => {
  const rango = {};
  if (desde) rango.$gte = parsearFecha(desde, 'desde');
  if (hasta) rango.$lte = finDeDia(hasta, 'hasta');
  if (rango.$gte && rango.$lte && rango.$gte > rango.$lte)
    throw new ApiError(400, 'La fecha "desde" no puede ser posterior a "hasta"');
  return rango;
};

module.exports = { SOLO_FECHA, parsearFecha, finDeDia, rangoFechas };
