const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['cajero', 'auxiliar', 'administrador'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidos: { type: String, required: [true, 'Los apellidos son obligatorios'], trim: true },
    correo: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El correo no es válido'],
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
    rol: { type: String, enum: { values: ROLES, message: 'Rol no válido' }, default: 'cajero' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('contrasena')) return next();
  this.contrasena = await bcrypt.hash(this.contrasena, 10);
  next();
});

usuarioSchema.methods.compararContrasena = function (texto) {
  return bcrypt.compare(texto, this.contrasena);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.contrasena;
  return obj;
};

usuarioSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('Usuario', usuarioSchema);
