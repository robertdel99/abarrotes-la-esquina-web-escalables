abarrotes la esquina

punto de venta para una tienda de abarrotes. en el avance del tercer parcial mejoré el catálogo público. puedes buscar un producto, elegir su categoría y ver solo lo que hay en existencia o en oferta. se muestran ocho productos por página. al abrir un producto y volver, sigues en la misma página con los mismos filtros.

para correrlo necesitas node 22.12 o node 24 y mongodb en tu equipo.

en la carpeta backend, ejecuta cp .env.example .env y luego npm ci. si es tu primera prueba, usa npm run seed en una base de prueba: este comando borra los datos de esa base y carga los de ejemplo. arranca la api con npm run dev.

en otra terminal, entra a frontend y ejecuta npm ci y npm start. abre http://localhost:4200/catalogo. puedes consultar el catálogo sin iniciar sesión.

si quieres entrar a caja o al inventario, las cuentas de ejemplo están en backend/src/seed.js.

para probar el avance con los datos de ejemplo, pulsa siguiente, abre un producto y vuelve al catálogo. después marca en oferta para ver solo los productos con descuento.
