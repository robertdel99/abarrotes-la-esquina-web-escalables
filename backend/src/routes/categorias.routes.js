const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/categorias.controller');

router.get('/', autenticar, autorizar('cajero', 'auxiliar', 'administrador'), ctrl.listar);
router.get('/:id', autenticar, autorizar('cajero', 'auxiliar', 'administrador'), ctrl.obtener);

router.post('/', autenticar, autorizar('auxiliar', 'administrador'), ctrl.crear);
router.put('/:id', autenticar, autorizar('auxiliar', 'administrador'), ctrl.actualizar);

router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);

module.exports = router;
