const router = require('express').Router();
const ctrl = require('../controllers/publico.controller');

router.get('/tienda', ctrl.infoTienda);
router.get('/categorias', ctrl.listarCategorias);
router.get('/ofertas', ctrl.listarOfertas);
router.get('/productos', ctrl.listarProductos);
router.get('/productos/:id', ctrl.obtenerProducto);

module.exports = router;
