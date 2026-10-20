const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/reportes.controller');

router.get('/ventas', autenticar, autorizar('administrador'), ctrl.resumenVentas);
router.get('/productos-mas-vendidos', autenticar, autorizar('administrador'), ctrl.productosMasVendidos);
router.get('/ventas-por-categoria', autenticar, autorizar('administrador'), ctrl.ventasPorCategoria);

module.exports = router;
