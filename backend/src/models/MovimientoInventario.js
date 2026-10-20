const mongoose = require('mongoose');

const TIPOS = ['entrada', 'salida', 'merma', 'venta', 'cancelacion'];

const movimientoSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    tipo: { type: String, enum: { values: TIPOS, message: 'Tipo de movimiento no válido' }, required: true },
    cantidad: { type: Number, required: true, min: [1, 'La cantidad mínima es 1'] },
    existenciaAnterior: { type: Number, required: true },
    existenciaNueva: { type: Number, required: true },
    motivo: { type: String, trim: true, default: '' },
    proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', default: null },
    venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta', default: null },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

movimientoSchema.statics.TIPOS = TIPOS;

module.exports = mongoose.model('MovimientoInventario', movimientoSchema);
