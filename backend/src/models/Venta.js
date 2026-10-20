const mongoose = require('mongoose');

const renglonSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: [1, 'La cantidad mínima es 1'] },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ventaSchema = new mongoose.Schema(
  {
    folio: { type: String, unique: true },
    turno: { type: mongoose.Schema.Types.ObjectId, ref: 'Turno', required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
    fecha: { type: Date, default: Date.now },
    renglones: {
      type: [renglonSchema],
      validate: [(v) => v.length > 0, 'La venta debe tener al menos un producto'],
    },
    total: { type: Number, required: true, min: 0 },
    pagoRecibido: { type: Number, required: true, min: 0 },
    cambio: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ['registrada', 'cancelada'], default: 'registrada' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venta', ventaSchema);
