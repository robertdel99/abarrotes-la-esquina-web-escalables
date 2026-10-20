const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/ventas.controller');

router.get('/', autenticar, autorizar('cajero', 'administrador'), ctrl.listar);
router.post('/', autenticar, autorizar('cajero', 'administrador'), ctrl.registrar);
router.get('/:id', autenticar, autorizar('cajero', 'administrador'), ctrl.obtener);
router.put('/:id/cancelar', autenticar, autorizar('cajero', 'administrador'), ctrl.cancelar);

module.exports = router;
