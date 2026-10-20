# Abarrotes La Esquina

Punto de venta para una tienda de abarrotes. Proyecto de Aplicaciones Web Escalables (UASLP, 2026-2027/I).
Hecho con MongoDB, Express, Angular y Node.

## Para correrlo

Se necesita Node y MongoDB corriendo en `mongodb://127.0.0.1:27017`.

Backend:
```bash
cd backend
cp .env.example .env
npm install
npm run seed      # datos de prueba
npm run dev       # http://localhost:3000
```

Frontend (en otra terminal):
```bash
cd frontend
npm install
npm start         # http://localhost:4200
```

## Usuarios de prueba

- Administrador: `admin@laesquina.com` / `Admin1234`
- Cajero: `cajero@laesquina.com` / `Cajero1234`
- Auxiliar: `auxiliar@laesquina.com` / `Auxiliar1234`

La propuesta y las rutas de la API están en `docs/`.
