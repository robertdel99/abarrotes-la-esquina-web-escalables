const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/usuarios.controller');

const soloAdmin = [autenticar, autorizar('administrador')];

router.get('/', ...soloAdmin, ctrl.listar);
router.get('/:id', ...soloAdmin, ctrl.obtener);
router.post('/', ...soloAdmin, ctrl.crear);
router.put('/:id', ...soloAdmin, ctrl.actualizar);
router.delete('/:id', ...soloAdmin, ctrl.eliminar);

module.exports = router;
