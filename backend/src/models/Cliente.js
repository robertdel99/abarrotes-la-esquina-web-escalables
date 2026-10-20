const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidos: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    correo: { type: String, trim: true, lowercase: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cliente', clienteSchema);
