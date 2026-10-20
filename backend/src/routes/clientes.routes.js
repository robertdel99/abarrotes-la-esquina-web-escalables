const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/clientes.controller');

router.get('/', autenticar, autorizar('cajero', 'administrador'), ctrl.listar);
router.get('/:id', autenticar, autorizar('cajero', 'administrador'), ctrl.obtener);
router.post('/', autenticar, autorizar('cajero', 'administrador'), ctrl.crear);
router.put('/:id', autenticar, autorizar('administrador'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);

module.exports = router;
