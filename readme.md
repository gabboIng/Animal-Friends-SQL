# Animal Friends

Aplicación web fullstack para la adopción de mascotas. Permite a los usuarios registrarse, publicar mascotas disponibles para adopción, editarlas, eliminarlas, adoptarlas y navegar por un catálogo paginado.

![Hero Banner](public/img/mascota2.png)

---

## Características

- **CRUD completo** de mascotas (Crear, Leer, Editar, Eliminar)
- **Autenticación JWT** con registro e inicio de sesión (contraseñas con bcrypt)
- **Registro de adopciones transaccional**: cada mascota puede ser adoptada una sola vez; la operación se protege con transacciones PostgreSQL (`BEGIN` / `SELECT FOR UPDATE` / `COMMIT`) y la fecha de adopción y el nombre del adoptante se muestran en las cards
- **Paginación** del catálogo de mascotas sin recargar la página
- **Subida de imágenes** con conversión automática a WebP (Sharp)
- **Página de error personalizada** (404/500) con imagen y sticky footer
- **Registro de accesos en archivos planos** (`logs/log.txt`) con fecha, hora y ruta accedida
- **Diseño responsivo** con Bootstrap 5
- **Alertas interactivas** con SweetAlert2

---

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Backend | Express.js 5, Node.js |
| Base de datos | PostgreSQL (pg, Pool) |
| Motor de plantillas | Handlebars (hbs) |
| Autenticación | JWT (jsonwebtoken), bcrypt |
| Subida de imágenes | Multer, Sharp |
| Frontend | Bootstrap 5, CSS custom, JavaScript vanilla |
| Alertas | SweetAlert2 |
| Gestor de paquetes | pnpm |

---

## Arquitectura del Proyecto

El proyecto sigue el patrón **MVC** (Modelo-Vista-Controlador):

- **Models**: consultas SQL parametrizadas sobre PostgreSQL (`mascotas`, `usuario`, `adopciones`).
- **Controllers**: lógica de negocio (validaciones, procesamiento de imágenes, respuestas HTTP).
- **Views**: plantillas Handlebars renderizadas en el servidor (`home`, `login`, `registro`, `crear-mascota`, `error`) con partials compartidos (`header`, `footer`).
- **Routes**: separación entre páginas HTML y API REST.
- **Middlewares**: autenticación JWT, registro de accesos en archivos planos y manejo global de errores.
- **Utils**: `AppError` (errores operacionales) y `catchAsync` (wrapper async/await).
- **Config**: conexión a PostgreSQL (`dbClient`), carga de archivos (`multer`) y procesamiento de imágenes (`procesarImagen`).

---

## Base de Datos

La base de datos **adopcion** en PostgreSQL contiene tres tablas:

### Tabla: usuarios

| Campo | Tipo | Requisito | Descripción |
|-------|------|-----------|-------------|
| `id` | SERIAL | PK | Identificador único |
| `nombre` | VARCHAR(255) | Requerido | Nombre del usuario |
| `apellido` | VARCHAR(255) | Requerido | Apellido del usuario |
| `email` | VARCHAR(255) | Requerido, único | Email |
| `clave` | VARCHAR(255) | Requerido | Contraseña (hash bcrypt) |
| `telefono` | NUMERIC | Opcional | Número de teléfono |
| `created_at` | TIMESTAMP | Auto | Fecha de creación |
| `updated_at` | TIMESTAMP | Auto | Fecha de última actualización |

### Tabla: mascotas

| Campo | Tipo | Requisito | Descripción |
|-------|------|-----------|-------------|
| `id` | SERIAL | PK | Identificador único |
| `nombre` | VARCHAR(255) | Requerido | Nombre de la mascota |
| `tipo` | VARCHAR(255) | Requerido | Tipo (Perro, Gato, Ave, Otro) |
| `sexo` | VARCHAR(10) | Requerido | Macho o Hembra (CHECK) |
| `edad` | NUMERIC | Requerido | Edad entre 0 y 30 (CHECK) |
| `imagen` | VARCHAR(500) | Opcional | Ruta de la imagen (WebP) |
| `descripcion` | TEXT | Opcional | Descripción de la mascota |
| `usuario_id` | INTEGER | Requerido (FK) | Usuario que publicó la mascota |
| `created_at` | TIMESTAMP | Auto | Fecha de creación |
| `updated_at` | TIMESTAMP | Auto | Fecha de última actualización |

### Tabla: adopciones

| Campo | Tipo | Requisito | Descripción |
|-------|------|-----------|-------------|
| `id` | SERIAL | PK | Identificador único |
| `usuario_id` | INTEGER | Requerido (FK) | Usuario que adopta |
| `mascota_id` | INTEGER | Requerido (FK, UNIQUE) | Mascota adoptada (una vez) |
| `fecha_adopcion` | TIMESTAMP | Auto | Fecha de la adopción |

### Relaciones

- Un **usuario** publica muchas **mascotas** (1:N a través de `mascotas.usuario_id`).
- Un **usuario** puede registrar muchas **adopciones** (1:N a través de `adopciones.usuario_id`).
- Una **mascota** tiene como máximo **una** adopción (1:1 a través de `UNIQUE(mascota_id)`).

### Diagrama Entidad-Relación

```mermaid
erDiagram
    USUARIOS {
        SERIAL id PK
        VARCHAR nombre
        VARCHAR apellido
        VARCHAR email UK
        VARCHAR clave
        NUMERIC telefono
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    MASCOTAS {
        SERIAL id PK
        VARCHAR nombre
        VARCHAR tipo
        VARCHAR sexo
        NUMERIC edad
        VARCHAR imagen
        TEXT descripcion
        INTEGER usuario_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ADOPCIONES {
        SERIAL id PK
        INTEGER usuario_id FK
        INTEGER mascota_id FK
        TIMESTAMP fecha_adopcion
    }

    USUARIOS ||--o{ MASCOTAS : "publica"
    USUARIOS ||--o{ ADOPCIONES : "adopta"
    MASCOTAS ||--o| ADOPCIONES : "es adoptada"
```

El esquema completo se encuentra en `sql/init.sql`.

---

## Flujo del Usuario

1. El visitante llega a la aplicación y es redirigido a **Iniciar Sesión** (`/login`).
2. Si no tiene cuenta, puede **Registrarse** (`/registro`); el registro devuelve al login.
3. Al iniciar sesión, el backend entrega un **token JWT** que se guarda en `localStorage`.
4. En el **home** (`/home`) se muestra el catálogo paginado de mascotas. Cada card muestra nombre, tipo, edad, descripción, sexo (icono) y, si fue adoptada, la fecha de adopción y el adoptante.
5. Desde el home se puede **Crear Mascota** (`/crear-mascota`) con subida de imagen.
6. Desde el modal de cada card se puede **Editar**, **Eliminar** o **Adoptar** la mascota (con confirmación vía SweetAlert).
7. La **paginación** actualiza las cards vía `GET /api/mascotas?page=&limit=` sin recargar la página.

### Diagrama de interacción del usuario

```mermaid
flowchart LR
    INICIO([Visita la web]) --> LOGIN[Inicia sesión o se registra]
    LOGIN --> HOME[Home / Catálogo de mascotas]
    HOME --> EXPLORAR[Explora las mascotas]
    HOME --> CREAR[Publica una mascota]
    HOME --> GESTIONAR[Edita o elimina sus mascotas]
    HOME --> ADOPTAR[Adopta una mascota]
    GESTIONAR --> HOME
    ADOPTAR --> HOME
    CREAR --> HOME
    EXPLORAR --> HOME
    HOME --> FIN([Cierra sesión])

    style INICIO fill:#4A90E2,color:#fff
    style HOME fill:#FF6F61,color:#fff
    style FIN fill:#555,color:#fff
```

---

## Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v11+
- [PostgreSQL](https://www.postgresql.org/)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/gabboIng/Animal-Friends-SQL.git
   cd Animal-Friends-SQL
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Crear la base de datos y las tablas**

   En PostgreSQL, crear la base de datos y ejecutar el script:
   ```bash
   psql -U postgres -d postgres -c "CREATE DATABASE adopcion;"
   psql -U postgres -d adopcion -f sql/init.sql
   ```

4. **Configurar variables de entorno**

   Crear archivo `.env` en la raíz con tus credenciales:
   ```env
   PORT=5100
   DATABASE_URL=postgresql://postgres:1234@localhost:5432/adopcion
   JWT_SECRET=tu_secreto_ultra_seguro
   ```

5. **Iniciar el servidor**
   ```bash
   # modo desarrollo (con auto-reinicio vía nodemon):
   npm run dev
   # o producción:
   npm start
   ```
   > Si usas `pnpm`, los mismos scripts funcionan con `pnpm run dev` / `pnpm start`.

6. **Abrir en el navegador**
   ```
   http://localhost:5100
   ```

---

## Registro de Accesos (Logs)

Cada petición recibida se registra en `logs/log.txt` mediante el middleware `middlewares/registrarAcceso.js`, que usa `fs.appendFileSync` para agregar una línea por acceso con la estructura mínima: **fecha, hora y ruta accedida** (más el método HTTP).

```
[14-08-2026, 12:05:33] GET /login
[14-08-2026, 12:05:41] GET /home
[14-08-2026, 12:06:02] GET /api/mascotas?page=2&limit=6
```

**Justificación de la decisión:** se optó por registrar **todas** las rutas (no solo una) mediante un middleware global, porque permite auditar el uso real de la aplicación sin duplicar lógica en cada ruta. El formato es una sola línea por evento para facilitar la lectura y el procesamiento posterior. La carpeta `logs/` está ignorada por Git, por lo que los accesos generados localmente no se suben al repositorio.

---

## Transacciones: registro seguro de adopciones

### El problema

Registrar una adopción requiere verificar que la mascota no esté adoptada y luego insertar el registro. Si esas dos operaciones se ejecutan con consultas independientes, existe una **condición de carrera**: dos usuarios podrían adoptar la misma mascota al mismo tiempo, pasar ambos la verificación y generar registros duplicados (el `UNIQUE(mascota_id)` lo impediría, pero con un error 500 en lugar de un 409 controlado).

### La solución

El modelo `models/adopciones.js` ejecuta toda la operación dentro de una **transacción** sobre un cliente dedicado del pool (`pool.connect()`, no `pool.query()`):

1. `BEGIN` — inicia la transacción.
2. `SELECT ... FROM mascotas WHERE id = $1 FOR UPDATE` — localiza la mascota y **bloquea su fila** hasta COMMIT/ROLLBACK. Cualquier otra transacción que intente adoptar la misma mascota queda en espera.
3. Verificación atómica — si la mascota no existe → 404; si ya tiene adopción → 409. Al estar la fila bloqueada, no hay ventana entre "verificar" e "insertar".
4. `INSERT INTO adopciones` — registra la adopción.
5. `COMMIT` — confirma todo; o `ROLLBACK` en caso de error, dejando la BD exactamente como estaba.
6. `finally { client.release() }` — devuelve el cliente al pool pase lo que pase (evita fugas de conexiones).

### Diagrama de secuencia

```mermaid
sequenceDiagram
    participant App as Aplicación
    participant DB as PostgreSQL

    App->>DB: BEGIN
    App->>DB: SELECT FROM mascotas FOR UPDATE
    alt mascota no existe
        App->>DB: ROLLBACK
    else ya adoptada
        App->>DB: ROLLBACK
    else disponible
        App->>DB: INSERT INTO adopciones
        App->>DB: COMMIT
    end
```

### Verificación

Probado con Postman sobre `POST /adopciones` (requiere JWT):

| Envío | Resultado | Efecto en la BD |
|-------|-----------|-----------------|
| 1ª vez, mascota disponible | **201 Created** + adopción registrada | Nueva fila en `adopciones` |
| 2ª vez, misma mascota | **409 Conflict** + "Esta mascota ya fue adoptada" | Ninguno (ROLLBACK) |
| `mascota_id` inexistente | **404 Not Found** + "Mascota no encontrada" | Ninguno (ROLLBACK) |

**Justificación de la decisión:** se optó por un diseño **normalizado**: el estado "adoptada" no se guarda en una columna de `mascotas`, sino que se deduce de la existencia de la fila en `adopciones` (una sola fuente de verdad). El `UNIQUE(mascota_id)` actúa como segunda capa de respaldo ante concurrencia extrema. Si en el futuro se necesita anular adopciones, la recomendación es agregar una columna de estado en `adopciones` (en lugar de borrar filas) para preservar el historial.

---

## Estructura del Proyecto

```
Animal-Friends-SQL/
├── app.js                      # Punto de entrada (Express, hbs, rutas, errores)
├── .env                        # Variables de entorno (no commitear)
├── .env.example                # Plantilla de variables de entorno
├── package.json
│
├── config/
│   ├── dbClient.js             # Conexión PostgreSQL (pg Pool)
│   ├── multer.js               # Config subida de archivos (máx. 10 MB)
│   └── procesarImagen.js       # Conversión de imágenes → WebP (Sharp)
│
├── controllers/
│   ├── adopciones.js           # Adoptar mascota + listar adopciones
│   ├── mascotas.js             # CRUD mascotas
│   └── usuario.js              # Registro + Login
│
├── helpers/
│   └── autenticacion.js        # JWT: generarToken + verificarToken
│
├── middlewares/
│   ├── errorHandler.js         # Manejo global de errores (HTML o JSON)
│   └── registrarAcceso.js      # Log de accesos en logs/log.txt
│
├── models/
│   ├── adopciones.js           # Queries SQL adopciones
│   ├── mascotas.js             # Queries SQL mascotas (paginación, joins)
│   └── usuario.js              # Queries SQL usuarios
│
├── routes/
│   ├── adopciones.js           # POST / y GET / (JWT)
│   ├── mascotas.js             # API REST mascotas (JWT)
│   ├── pages.js                # Rutas de páginas (HTML) + catch-all 404
│   └── usuario.js              # API REST usuarios
│
├── sql/
│   └── init.sql                # Esquema PostgreSQL (usuarios, mascotas, adopciones)
│
├── logs/
│   └── log.txt                 # Registro de accesos (auto-generado, no commitear)
│
├── utils/
│   ├── AppError.js           # Clase error personalizada
│   └── catchAsync.js         # Wrapper async/await
│
├── public/
│   ├── css/                  # shared, home, login, registro, crear-mascota, error
│   ├── img/                  # Imágenes estáticas
│   └── js/                   # paginador, login, registro, crear-mascota
│
├── uploads/                  # Imágenes subidas (no commitear)
│
└── views/
    ├── home.hbs              # Página principal + catálogo + modal editar/adoptar
    ├── login.hbs             # Inicio de sesión
    ├── registro.hbs          # Registro de usuario
    ├── crear-mascota.hbs     # Formulario crear mascota
    ├── error.hbs             # Página de error (404/500)
    └── partials/
        ├── header.hbs        # Navbar (links condicionales)
        └── footer.hbs        # Footer + CDN SweetAlert2 + scripts
```

---

## API Routes

### Páginas (HTML)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Redirige a `/login` |
| `GET` | `/home` | Catálogo paginado de mascotas |
| `GET` | `/login` | Página de inicio de sesión |
| `GET` | `/registro` | Página de registro |
| `GET` | `/crear-mascota` | Formulario para crear mascota |
| `GET` | `*` | Página de error 404 (catch-all) |

### Mascotas (API REST) — requiere JWT

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/mascotas` | Obtener todas las mascotas |
| `GET` | `/mascotas/:id` | Obtener una mascota |
| `POST` | `/mascotas` | Crear mascota (multipart/form-data) |
| `PUT` | `/mascotas/:id` | Actualizar mascota |
| `DELETE` | `/mascotas/:id` | Eliminar mascota + archivo |

### Paginación (pública)

| Método | Ruta | Parámetros | Descripción |
|--------|------|------------|-------------|
| `GET` | `/api/mascotas` | `page`, `limit` | Mascotas paginadas (JSON) |

### Usuarios (API REST)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/usuario/registrar` | Registrar usuario |
| `POST` | `/usuario/login` | Iniciar sesión (devuelve JWT) |

### Adopciones (API REST)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/adopciones` | Registrar adopción (requiere JWT) |
| `GET` | `/adopciones` | Listar adopciones con nombre de mascota y adoptante |

---

## Autor

**gabboIng** — [GitHub](https://github.com/gabboIng)
