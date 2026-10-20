require('dotenv').config();
const mongoose = require('mongoose');
const conectarDB = require('./config/db');
const {
  Usuario,
  Categoria,
  Proveedor,
  Producto,
  Cliente,
  Turno,
  Venta,
  MovimientoInventario,
} = require('./models');

async function seed() {
  await conectarDB();
  await Promise.all(
    [Usuario, Categoria, Proveedor, Producto, Cliente, Turno, Venta, MovimientoInventario].map((M) =>
      M.deleteMany({})
    )
  );

  const [admin, cajero, auxiliar] = await Usuario.create([
    {
      nombre: 'Roberto',
      apellidos: 'Delgado Flores',
      correo: 'admin@laesquina.com',
      contrasena: 'Admin1234',
      rol: 'administrador',
    },
    {
      nombre: 'Ana',
      apellidos: 'López Ruiz',
      correo: 'cajero@laesquina.com',
      contrasena: 'Cajero1234',
      rol: 'cajero',
    },
    {
      nombre: 'Luis',
      apellidos: 'Pérez Mata',
      correo: 'auxiliar@laesquina.com',
      contrasena: 'Auxiliar1234',
      rol: 'auxiliar',
    },
  ]);

  const cats = {};
  for (const c of await Categoria.create([
    { nombre: 'Abarrotes', descripcion: 'Básicos de despensa' },
    { nombre: 'Bebidas', descripcion: 'Refrescos, jugos y agua' },
    { nombre: 'Lácteos', descripcion: 'Leche, queso y yogur' },
    { nombre: 'Limpieza', descripcion: 'Detergentes y productos del hogar' },
    { nombre: 'Botanas', descripcion: 'Frituras y dulces' },
  ]))
    cats[c.nombre] = c._id;

  const provs = {};
  for (const p of await Proveedor.create([
    {
      nombre: 'Distribuidora Potosina',
      contacto: 'Jorge Ramos',
      telefono: '444 555 0101',
      correo: 'ventas@dipotosina.mx',
      direccion: 'Zona Industrial, SLP',
    },
    {
      nombre: 'Lácteos del Bajío',
      contacto: 'María Torres',
      telefono: '444 555 0202',
      correo: 'pedidos@lacteosbajio.mx',
      direccion: 'Soledad de G.S.',
    },
    {
      nombre: 'Refrescos del Centro',
      contacto: 'Carlos Vega',
      telefono: '444 555 0303',
      correo: 'contacto@refrescoscentro.mx',
      direccion: 'Av. Industrias, SLP',
    },
  ]))
    provs[p.nombre] = p._id;

  const P = (codigo, nombre, cat, prov, precioVenta, precioCompra, unidadMedida, existencia, extra = {}) => ({
    codigo,
    nombre,
    categoria: cats[cat],
    proveedor: provs[prov],
    precioVenta,
    precioCompra,
    unidadMedida,
    existencia,
    existenciaMinima: 5,
    ...extra,
  });
  await Producto.create([
    P('A-1001', 'Aceite 1 L', 'Abarrotes', 'Distribuidora Potosina', 38.5, 30, 'litro', 24, {
      enOferta: true,
      precioOferta: 35,
    }),
    P('A-1002', 'Arroz 1 kg', 'Abarrotes', 'Distribuidora Potosina', 32.9, 25, 'kg', 40),
    P('A-1003', 'Frijol 1 kg', 'Abarrotes', 'Distribuidora Potosina', 29.9, 22, 'kg', 12),
    P('A-1004', 'Azúcar 1 kg', 'Abarrotes', 'Distribuidora Potosina', 28, 21, 'kg', 18),
    P('A-1005', 'Huevo 12 pzas', 'Abarrotes', 'Distribuidora Potosina', 48, 39, 'paquete', 9),
    P('L-2001', 'Leche entera 1 L', 'Lácteos', 'Lácteos del Bajío', 26, 20, 'litro', 3, {
      enOferta: true,
      precioOferta: 24,
    }),
    P('L-2002', 'Queso panela 400 g', 'Lácteos', 'Lácteos del Bajío', 62, 48, 'pieza', 7),
    P('B-3001', 'Refresco 2 L', 'Bebidas', 'Refrescos del Centro', 34.5, 27, 'pieza', 31),
    P('B-3002', 'Agua 1.5 L', 'Bebidas', 'Refrescos del Centro', 15, 10, 'pieza', 50),
    P('C-4001', 'Detergente 1 kg', 'Limpieza', 'Distribuidora Potosina', 45, 36, 'kg', 0),
    P('C-4002', 'Cloro 1 L', 'Limpieza', 'Distribuidora Potosina', 22, 16, 'litro', 14),
    P('S-5001', 'Papas fritas 45 g', 'Botanas', 'Distribuidora Potosina', 18, 13, 'pieza', 60, {
      enOferta: true,
      precioOferta: 15,
    }),
  ]);

  await Cliente.create([
    { nombre: 'María', apellidos: 'Hernández', telefono: '444 111 2233', correo: 'maria@example.com' },
    { nombre: 'Pedro', apellidos: 'Sánchez', telefono: '444 222 3344' },
    { nombre: 'Lupita', apellidos: 'García', telefono: '444 333 4455', correo: 'lupita@example.com' },
  ]);

  console.log('Datos de prueba cargados.');
  console.log('  administrador: admin@laesquina.com / Admin1234');
  console.log('  cajero:        cajero@laesquina.com / Cajero1234');
  console.log('  auxiliar:      auxiliar@laesquina.com / Auxiliar1234');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
