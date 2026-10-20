const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { SOLO_FECHA, parsearFecha } = require('../utils/fechas');
const { Venta, Producto, Categoria } = require('../models');

const ZONA_HORARIA = process.env.ZONA_HORARIA || 'America/Mexico_City';
const DIAS_POR_DEFECTO = 30;

const redondear = (n) => Math.round((n || 0) * 100) / 100;

const rangoFechas = (query) => {
  const hasta = query.hasta ? parsearFecha(query.hasta, 'hasta') : new Date();
  if (!query.hasta || SOLO_FECHA.test(query.hasta)) hasta.setHours(23, 59, 59, 999);

  let desde;
  if (query.desde) {
    desde = parsearFecha(query.desde, 'desde');
  } else {
    desde = new Date(hasta);
    desde.setDate(desde.getDate() - DIAS_POR_DEFECTO);
    desde.setHours(0, 0, 0, 0);
  }

  if (desde > hasta) throw new ApiError(400, 'La fecha "desde" no puede ser posterior a "hasta"');
  return { desde, hasta };
};

const filtroVentas = (query) => {
  const { desde, hasta } = rangoFechas(query);
  return { estado: 'registrada', fecha: { $gte: desde, $lte: hasta } };
};

const resumenVentas = asyncHandler(async (req, res) => {
  const porDia = await Venta.aggregate([
    { $match: filtroVentas(req.query) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha', timezone: ZONA_HORARIA } },
        total: { $sum: '$total' },
        tickets: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, fecha: '$_id', total: { $round: ['$total', 2] }, tickets: 1 } },
  ]);

  const totalVentas = redondear(porDia.reduce((suma, dia) => suma + dia.total, 0));
  const numeroTickets = porDia.reduce((suma, dia) => suma + dia.tickets, 0);
  const ticketPromedio = numeroTickets ? redondear(totalVentas / numeroTickets) : 0;

  res.json({ totalVentas, numeroTickets, ticketPromedio, porDia });
});

const productosMasVendidos = asyncHandler(async (req, res) => {
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 10, 1), 100);

  const productos = await Venta.aggregate([
    { $match: filtroVentas(req.query) },
    { $sort: { fecha: -1 } },
    { $unwind: '$renglones' },
    {
      $group: {
        _id: '$renglones.producto',
        nombre: { $first: '$renglones.nombre' },
        cantidad: { $sum: '$renglones.cantidad' },
        total: { $sum: '$renglones.subtotal' },
      },
    },
    { $sort: { cantidad: -1, total: -1 } },
    { $limit: limite },
    { $project: { _id: 0, producto: '$_id', nombre: 1, cantidad: 1, total: { $round: ['$total', 2] } } },
  ]);

  res.json(productos);
});

const ventasPorCategoria = asyncHandler(async (req, res) => {
  const categorias = await Venta.aggregate([
    { $match: filtroVentas(req.query) },
    { $unwind: '$renglones' },
    {
      $lookup: {
        from: Producto.collection.name,
        localField: 'renglones.producto',
        foreignField: '_id',
        as: 'producto',
      },
    },
    { $unwind: '$producto' },
    {
      $lookup: {
        from: Categoria.collection.name,
        localField: 'producto.categoria',
        foreignField: '_id',
        as: 'categoria',
      },
    },
    { $unwind: '$categoria' },
    {
      $group: {
        _id: '$categoria._id',
        nombre: { $first: '$categoria.nombre' },
        total: { $sum: '$renglones.subtotal' },
        cantidad: { $sum: '$renglones.cantidad' },
      },
    },
    { $sort: { total: -1 } },
    { $project: { _id: 0, categoria: '$_id', nombre: 1, total: { $round: ['$total', 2] }, cantidad: 1 } },
  ]);

  res.json(categorias);
});

module.exports = { resumenVentas, productosMasVendidos, ventasPorCategoria };
