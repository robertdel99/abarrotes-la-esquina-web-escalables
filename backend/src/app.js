const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const ApiError = require('./utils/ApiError');
const { manejarErrores } = require('./middlewares');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/salud', (req, res) => res.json({ ok: true, nombre: 'Abarrotes La Esquina API' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/publico', require('./routes/publico.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/turnos', require('./routes/turnos.routes'));
app.use('/api/ventas', require('./routes/ventas.routes'));
app.use('/api/inventario', require('./routes/inventario.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));

app.use((req, res, next) => next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`)));

app.use(manejarErrores);

module.exports = app;
