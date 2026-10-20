require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/db');

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env (copia .env.example a .env)');
  process.exit(1);
}

conectarDB()
  .then(() => app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
