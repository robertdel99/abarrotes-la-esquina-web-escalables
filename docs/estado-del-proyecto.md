# Estado del proyecto

avance del tercer parcial. el catálogo público ya filtra existencias y ofertas desde la api, muestra ocho productos por página y conserva la búsqueda al volver de un producto.

## Funciona

- Parte pública sin sesión: inicio con ofertas de la semana y datos de la tienda, catálogo con búsqueda y filtro por categoría, detalle de producto.
- Inicio de sesión con JWT y redirección según el rol; menú lateral que sólo muestra lo que cada rol puede usar; guards de ruta e interceptores de token y de errores.
- Cajero: abrir turno, punto de venta (búsqueda de productos, ticket, cliente opcional o público en general, cobro con cambio, ticket con folio), ventas del turno con cancelación, corte de caja con diferencia.
- Auxiliar: alta y edición de productos, categorías y proveedores; entradas, salidas y mermas de inventario; existencias bajas.
- Administrador: todo lo anterior más eliminación (lógica cuando hay historial), usuarios, clientes, ofertas de la semana, historial de cortes y reportes (ventas por día, productos más vendidos, ventas por categoría).
- CRUD completo en Usuario, Producto, Categoría, Proveedor y Cliente; Venta, Turno y Movimiento de inventario como registros históricos.
- Manejo de errores en ambos lados: middleware central en Express (validación, duplicados, JWT, 404) y notificaciones en Angular.
- Datos de prueba (`npm run seed`) y 72 pruebas de la API (`npm run prueba`).

## Pendiente

- Imagen de producto por archivo: hoy se captura como URL. Sería una mejora, no parte del alcance.
- Despliegue en un servidor; por ahora corre en local.
- Pruebas unitarias de Angular (no exigidas por la rúbrica).
- los listados del área privada todavía se muestran completos.

## Próximos pasos

- Revisión parcial con el profesor y ajustes que resulten.
- Pulido de textos y pantallas con la retroalimentación.
