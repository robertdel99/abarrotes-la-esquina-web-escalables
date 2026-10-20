const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaApertura: { type: Date, default: Date.now },
    fechaCierre: { type: Date, default: null },
    fondoInicial: {
      type: Number,
      required: [true, 'El fondo inicial es obligatorio'],
      min: [0, 'El fondo no puede ser negativo'],
    },
    totalVendido: { type: Number, default: 0 },
    numeroTickets: { type: Number, default: 0 },
    efectivoEsperado: { type: Number, default: null },
    efectivoContado: { type: Number, default: null },
    diferencia: { type: Number, default: null },
    estado: { type: String, enum: ['abierto', 'cerrado'], default: 'abierto' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Turno', turnoSchema);
