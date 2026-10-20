const router = require('express').Router();
const { autenticar } = require('../middlewares');
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.get('/perfil', autenticar, ctrl.perfil);
router.put('/perfil', autenticar, ctrl.actualizarPerfil);

module.exports = router;
