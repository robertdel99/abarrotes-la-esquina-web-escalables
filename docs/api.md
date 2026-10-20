# API REST

Base local: `http://localhost:3000/api`. Todas las rutas responden JSON; los errores tienen la forma `{ "mensaje": string, "detalles"?: string[] }`.

Autenticación: `POST /api/auth/login` devuelve `{ token, usuario }`; el token se envía en cada petición como `Authorization: Bearer <token>`.

Roles: **público** (sin sesión), `cajero`, `auxiliar`, `administrador`. Un rol sin permiso recibe `403`; sin token, `401`.

## `/api/auth`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/perfil` | cualquier usuario con sesión |
| PUT | `/api/auth/perfil` | cualquier usuario con sesión |

## `/api/publico`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/publico/tienda` | público |
| GET | `/api/publico/categorias` | público |
| GET | `/api/publico/ofertas` | público |
| GET | `/api/publico/productos` | público |
| GET | `/api/publico/productos/:id` | público |

## `/api/categorias`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/categorias` | cajero, auxiliar, administrador |
| GET | `/api/categorias/:id` | cajero, auxiliar, administrador |
| POST | `/api/categorias` | auxiliar, administrador |
| PUT | `/api/categorias/:id` | auxiliar, administrador |
| DELETE | `/api/categorias/:id` | administrador |

## `/api/proveedores`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/proveedores` | cajero, auxiliar, administrador |
| GET | `/api/proveedores/:id` | cajero, auxiliar, administrador |
| POST | `/api/proveedores` | auxiliar, administrador |
| PUT | `/api/proveedores/:id` | auxiliar, administrador |
| DELETE | `/api/proveedores/:id` | administrador |

## `/api/productos`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/productos` | ...TODOS |
| GET | `/api/productos/:id` | ...TODOS |
| POST | `/api/productos` | auxiliar, administrador |
| PUT | `/api/productos/:id` | auxiliar, administrador |
| DELETE | `/api/productos/:id` | administrador |

## `/api/clientes`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/clientes` | cajero, administrador |
| GET | `/api/clientes/:id` | cajero, administrador |
| POST | `/api/clientes` | cajero, administrador |
| PUT | `/api/clientes/:id` | administrador |
| DELETE | `/api/clientes/:id` | administrador |

## `/api/usuarios`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/usuarios` | público |
| GET | `/api/usuarios/:id` | público |
| POST | `/api/usuarios` | público |
| PUT | `/api/usuarios/:id` | público |
| DELETE | `/api/usuarios/:id` | público |

## `/api/turnos`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/turnos/actual` | cajero, administrador |
| POST | `/api/turnos/abrir` | cajero, administrador |
| PUT | `/api/turnos/:id/cerrar` | cajero, administrador |
| GET | `/api/turnos` | cajero, administrador |
| GET | `/api/turnos/:id` | cajero, administrador |

## `/api/ventas`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/ventas` | cajero, administrador |
| POST | `/api/ventas` | cajero, administrador |
| GET | `/api/ventas/:id` | cajero, administrador |
| PUT | `/api/ventas/:id/cancelar` | cajero, administrador |

## `/api/inventario`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/inventario/movimientos` | auxiliar, administrador |
| POST | `/api/inventario/movimientos` | auxiliar, administrador |
| GET | `/api/inventario/bajos` | auxiliar, administrador |

## `/api/reportes`

| Método | Ruta | Quién puede |
| --- | --- | --- |
| GET | `/api/reportes/ventas` | administrador |
| GET | `/api/reportes/productos-mas-vendidos` | administrador |
| GET | `/api/reportes/ventas-por-categoria` | administrador |

Total: 48 rutas.
