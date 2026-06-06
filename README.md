# Hogar Compartido

Web app full stack para gestionar ingresos, egresos, presupuestos, metas de ahorro y balance de gastos entre dos personas.

## Stack

Frontend:
- React, TypeScript, Vite, Tailwind CSS
- React Router, React Hook Form, Zod
- TanStack Query, Axios, Recharts, date-fns

Backend:
- Node.js, Express, TypeScript
- MongoDB, Mongoose
- Zod, JWT Auth, bcrypt
- cors, dotenv, helmet, morgan

## Estructura

```txt
root/
  frontend/
  backend/
  docker-compose.yml
  README.md
```

## Requisitos

- Node.js 22 recomendado
- npm
- MongoDB local o Docker

## Configuración local

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

URLs por defecto:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- API: `http://localhost:4000/api`

## Variables de entorno

Backend `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/couple_budget
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Frontend `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Seed de prueba

Con MongoDB levantado:

```bash
cd backend
npm run seed
```

Credenciales:

```txt
Email: ana@example.com
Password: password123
```

El seed crea un household, categorías iniciales, movimientos, presupuestos, una meta de ahorro, una aportación y una transacción recurrente.

## Docker

Para levantar MongoDB, backend y frontend:

```bash
docker compose up --build
```

El compose usa MongoDB en `mongo:27017`, expone backend en `4000` y frontend en `5173`.

## Scripts

Backend:

```bash
npm run dev
npm run build
npm start
npm run seed
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## API REST

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Households:
- `POST /api/households`
- `GET /api/households/current`
- `PUT /api/households/:id`
- `POST /api/households/:id/invite`
- `DELETE /api/households/:id/data`

Transactions:
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

Categories:
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

Budgets:
- `GET /api/budgets`
- `POST /api/budgets`
- `PUT /api/budgets/:id`
- `DELETE /api/budgets/:id`

Savings Goals:
- `GET /api/savings-goals`
- `POST /api/savings-goals`
- `PUT /api/savings-goals/:id`
- `DELETE /api/savings-goals/:id`
- `POST /api/savings-goals/:id/contributions`

Reports:
- `GET /api/reports/summary`
- `GET /api/reports/category-breakdown`
- `GET /api/reports/income-vs-expense`
- `GET /api/reports/partner-balance`
- `GET /api/reports/month-comparison`
- `GET /api/reports/export.csv`

## Verificación

Se han ejecutado:

```bash
cd backend && npm run build
cd frontend && npm run build
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high
```

Ambos builds pasan y npm audit no reporta vulnerabilidades de severidad alta o superior.

