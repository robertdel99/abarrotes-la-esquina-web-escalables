const mongoose = require('mongoose');

async function conectarDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/abarrotes_la_esquina';
  await mongoose.connect(uri);
  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}

module.exports = conectarDB;
