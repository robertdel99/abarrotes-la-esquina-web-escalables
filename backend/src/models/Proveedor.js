const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    contacto: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    correo: { type: String, trim: true, lowercase: true, default: '' },
    direccion: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proveedor', proveedorSchema);
