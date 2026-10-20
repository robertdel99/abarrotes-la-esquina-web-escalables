const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    descripcion: { type: String, trim: true, default: '' },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La categoría es obligatoria'],
    },
    proveedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: [true, 'El proveedor es obligatorio'],
    },
    precioVenta: {
      type: Number,
      required: [true, 'El precio de venta es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    precioCompra: {
      type: Number,
      required: [true, 'El precio de compra es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    unidadMedida: { type: String, trim: true, default: 'pieza' },
    existencia: { type: Number, default: 0, min: [0, 'La existencia no puede ser negativa'] },
    existenciaMinima: { type: Number, default: 5, min: 0 },
    imagen: { type: String, trim: true, default: '' },
    enOferta: { type: Boolean, default: false },
    precioOferta: { type: Number, min: 0, default: null },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productoSchema.virtual('disponible').get(function () {
  return this.activo && this.existencia > 0;
});
productoSchema.virtual('existenciaBaja').get(function () {
  return this.existencia <= this.existenciaMinima;
});

module.exports = mongoose.model('Producto', productoSchema);
