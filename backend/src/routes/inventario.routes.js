const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/inventario.controller');

router.get('/movimientos', autenticar, autorizar('auxiliar', 'administrador'), ctrl.listarMovimientos);
router.post('/movimientos', autenticar, autorizar('auxiliar', 'administrador'), ctrl.registrarMovimiento);
router.get('/bajos', autenticar, autorizar('auxiliar', 'administrador'), ctrl.listarBajos);

module.exports = router;
