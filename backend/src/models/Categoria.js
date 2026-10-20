const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], unique: true, trim: true },
    descripcion: { type: String, trim: true, default: '' },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
