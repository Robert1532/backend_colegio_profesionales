# Colegio Profesionales - Backend API

Este es el backend de la aplicación Colegio Profesionales, construido con Express.js y MySQL.

## Requisitos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## Instalación

1. **Clonar el repositorio**
```bash
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` en la raíz del proyecto backend:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de base de datos:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=colegio_profesionales
PORT=3000
JWT_SECRET=tu_clave_secreta_cambiar_en_produccion
NODE_ENV=development
```

4. **Crear la base de datos**

Opción A: Usar el script SQL
```bash
mysql -u root -p < backend/database/schema.sql
```

Opción B: Conectarse a MySQL y ejecutar manualmente
```sql
CREATE DATABASE colegio_profesionales;
USE colegio_profesionales;
-- Copiar y pegar el contenido de backend/database/schema.sql
```

## Ejecutar el servidor

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
backend/
├── config/
│   └── db.js              # Configuración de conexión a MySQL
├── controllers/
│   ├── defensasController.js
│   ├── horariosController.js
│   ├── pagosController.js
│   ├── postulacionesController.js
│   └── profesionalesController.js
├── routes/
│   ├── auth.js            # Autenticación
│   ├── defensas.js        # Defensas académicas
│   ├── horarios.js        # Horarios de profesionales
│   ├── pagos.js           # Pagos
│   ├── postulacionesRoutes.js  # Postulaciones
│   └── profesionales.js   # Profesionales
├── database/
│   └── schema.sql         # Esquema de la base de datos
├── .env.example           # Variables de entorno (ejemplo)
├── .gitignore             # Archivos ignorados por Git
├── package.json           # Dependencias
└── server.js              # Punto de entrada
```

## Endpoints de la API

### Autenticación (`/api/auth`)

**POST** `/api/auth/login`
```json
{
  "correo": "usuario@example.com",
  "password": "contraseña"
}
```

**POST** `/api/auth/register`
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "password": "contraseña",
  "telefono": "+34123456789",
  "rol": "profesional",
  "especialidad": "Derecho"
}
```

**POST** `/api/auth/verify`
```json
{
  "token": "jwt_token"
}
```

### Defensas (`/api/defensas`)

**GET** `/api/defensas` - Obtener todas las defensas
**GET** `/api/defensas/:id` - Obtener defensa por ID
**GET** `/api/defensas/estado/:estado` - Obtener defensas por estado
**POST** `/api/defensas` - Crear nueva defensa
**PUT** `/api/defensas/:id` - Actualizar defensa
**DELETE** `/api/defensas/:id` - Eliminar defensa

### Profesionales (`/api/profesionales`)

**GET** `/api/profesionales` - Obtener todos los profesionales
**GET** `/api/profesionales/:id` - Obtener profesional por ID
**GET** `/api/profesionales/estado/:estado` - Obtener por estado
**PUT** `/api/profesionales/:id` - Actualizar profesional
**PATCH** `/api/profesionales/:id/approve` - Aprobar profesional
**PATCH** `/api/profesionales/:id/reject` - Rechazar profesional

### Horarios (`/api/horarios`)

**GET** `/api/horarios/:profesionalId` - Obtener horarios
**POST** `/api/horarios` - Crear horario
**PUT** `/api/horarios/:id` - Actualizar horario
**DELETE** `/api/horarios/:id` - Eliminar horario

### Pagos (`/api/pagos`)

**GET** `/api/pagos` - Obtener todos los pagos
**GET** `/api/pagos/estado/:estado` - Obtener pagos por estado
**GET** `/api/pagos/profesional/:profesionalId` - Obtener pagos de un profesional
**POST** `/api/pagos` - Crear nuevo pago
**PUT** `/api/pagos/:id` - Actualizar estado de pago
**DELETE** `/api/pagos/:id` - Eliminar pago

### Postulaciones (`/api/postulaciones`)

**GET** `/api/postulaciones` - Obtener todas las postulaciones
**GET** `/api/postulaciones/profesional/:profesionalId` - Por profesional
**GET** `/api/postulaciones/defensa/:defensaId` - Por defensa
**POST** `/api/postulaciones` - Crear postulación
**PUT** `/api/postulaciones/:id` - Actualizar postulación
**DELETE** `/api/postulaciones/:id` - Eliminar postulación

## Errores Comunes

### "MySQL conectado" no aparece
- Verifica que MySQL está corriendo
- Comprueba las credenciales en `.env`
- Asegúrate que la base de datos existe

### "Cannot find module 'jsonwebtoken'"
```bash
npm install jsonwebtoken
```

### Error de conexión a la base de datos
Reinicia el servidor o verifica:
```bash
mysql -u root -p
mysql> SHOW DATABASES;
mysql> USE colegio_profesionales;
mysql> SHOW TABLES;
```

## Seguridad

- **JWT_SECRET**: Cambiar en `.env` en producción
- **Contraseñas**: Se hashean con bcrypt
- **CORS**: Habilitado para desarrollo
- **SQL Injection**: Protegido con prepared statements

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| DB_HOST | Host de MySQL | localhost |
| DB_USER | Usuario de MySQL | root |
| DB_PASSWORD | Contraseña de MySQL | 1532 |
| DB_NAME | Nombre de la BD | colegio_profesionales |
| PORT | Puerto del servidor | 3000 |
| JWT_SECRET | Clave secreta JWT | secretkey_change_in_production |
| NODE_ENV | Entorno | development |

## Licencia

ISC

## Soporte

Para reportar errores o sugerir mejoras, contacta al equipo de desarrollo.
