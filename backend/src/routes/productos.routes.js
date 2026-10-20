const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares');
const ctrl = require('../controllers/productos.controller');

const TODOS = ['cajero', 'auxiliar', 'administrador'];

router.get('/', autenticar, autorizar(...TODOS), ctrl.listar);
router.get('/:id', autenticar, autorizar(...TODOS), ctrl.obtener);
router.post('/', autenticar, autorizar('auxiliar', 'administrador'), ctrl.crear);
router.put('/:id', autenticar, autorizar('auxiliar', 'administrador'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);

module.exports = router;
