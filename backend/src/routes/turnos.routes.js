const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/turnos.controller');

const caja = autorizar('cajero', 'administrador');

router.get('/actual', autenticar, caja, ctrl.actual);
router.post('/abrir', autenticar, caja, ctrl.abrir);
router.put('/:id/cerrar', autenticar, caja, ctrl.cerrar);
router.get('/', autenticar, caja, ctrl.listar);
router.get('/:id', autenticar, caja, ctrl.obtener);

module.exports = router;
