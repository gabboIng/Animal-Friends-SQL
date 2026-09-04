# Animal Friends

Aplicación web fullstack para la adopción de mascotas. Permite a los usuarios registrarse, publicar mascotas disponibles para adopción, editarlas, eliminarlas, adoptarlas y navegar por un catálogo paginado.

![Hero Banner](public/img/mascota2.png)

---

## Características

- **CRUD completo** de mascotas (Crear, Leer, Editar, Eliminar)
- **Autenticación JWT** con registro e inicio de sesión (contraseñas con bcrypt)
- **Registro de adopciones transaccional**: cada mascota puede ser adoptada una sola vez; la operación se protege con transacciones de Sequelize (`sequelize.transaction()` + `lock: true`) y la fecha de adopción y el nombre del adoptante se muestran en las cards
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
| Base de datos | PostgreSQL, Sequelize (ORM) + sequelize-cli |
| Motor de plantillas | Handlebars (hbs) |
| Autenticación | JWT (jsonwebtoken), bcrypt |
| Subida de imágenes | Multer, Sharp |
| Frontend | Bootstrap 5, CSS custom, JavaScript vanilla |
| Alertas | SweetAlert2 |
| Gestor de paquetes | pnpm |

---

## Arquitectura del Proyecto

El proyecto sigue el patrón **MVC** (Modelo-Vista-Controlador):

- **Models**: ORM **Sequelize** (`models/orm/`) más una capa de repositorio (`models/mascotas.js`, `models/usuario.js`, `models/adopciones.js`) que expone las consultas con la forma exacta que esperan las vistas.
- **Controllers**: lógica de negocio (validaciones, procesamiento de imágenes, respuestas HTTP).
- **Views**: plantillas Handlebars renderizadas en el servidor (`home`, `login`, `registro`, `crear-mascota`, `error`) con partials compartidos (`header`, `footer`).
- **Routes**: separación entre páginas HTML y API REST.
- **Middlewares**: autenticación JWT, registro de accesos en archivos planos y manejo global de errores.
- **Utils**: `AppError` (errores operacionales) y `catchAsync` (wrapper async/await).
- **Config**: conexión a PostgreSQL con Sequelize (`dbClient`), configuración de sequelize-cli (`config.cjs`), carga de archivos (`multer`) y procesamiento de imágenes (`procesarImagen`).

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

El esquema completo está versionado en las migraciones de Sequelize (`migrations/`). El archivo `sql/init.sql` se conserva únicamente como referencia del esquema.

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

3. **Crear la base de datos**

   En PostgreSQL, crear la base de datos:
   ```bash
   psql -U postgres -d postgres -c "CREATE DATABASE adopcion;"
   ```

4. **Configurar variables de entorno**

   Crear archivo `.env` en la raíz con tus credenciales:
   ```env
   PORT=5100
   DATABASE_URL=postgresql://postgres:1234@localhost:5432/adopcion
   JWT_SECRET=tu_secreto_ultra_seguro
   ```

5. **Ejecutar las migraciones** (crea las tablas con Sequelize):

   ```bash
   pnpm run db:migrate
   ```
   > Las migraciones son idempotentes (`CREATE TABLE IF NOT EXISTS`), por lo que
   > también se pueden ejecutar sobre una base de datos que ya tenga las tablas.

6. **Iniciar el servidor**
   ```bash
   # modo desarrollo (con auto-reinicio vía nodemon):
   npm run dev
   # o producción:
   npm start
   ```
   > Si usas `pnpm`, los mismos scripts funcionan con `pnpm run dev` / `pnpm start`.

7. **Abrir en el navegador**
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

El modelo `models/adopciones.js` ejecuta toda la operación dentro de una **transacción** de Sequelize (`sequelize.transaction()`), que gestiona internamente el cliente dedicado:

1. `sequelize.transaction(async (t) => {...})` — abre la transacción; hace **COMMIT automático** al retornar el callback y **ROLLBACK** si este lanza un error. No hay que manejar `BEGIN`/`COMMIT`/`ROLLBACK` ni liberar el cliente a mano.
2. `Mascota.findByPk(id, { transaction: t, lock: true })` — localiza la mascota y la **bloquea** (`SELECT ... FOR UPDATE`). Cualquier otra transacción que intente adoptar la misma mascota queda en espera.
3. Verificación atómica — si la mascota no existe → 404; si ya tiene adopción → 409. Al estar la fila bloqueada, no hay ventana entre "verificar" e "insertar".
4. `Adopcion.create({...}, { transaction: t })` — registra la adopción dentro de la misma transacción.

```js
async adoptar(usuario_id, mascota_id) {
    return await sequelize.transaction(async (t) => {
        const mascota = await Mascota.findByPk(mascota_id, {
            transaction: t,
            lock: true // SELECT ... FOR UPDATE
        });
        if (!mascota) {
            throw new AppError('Mascota no encontrada', 404);
        }

        const yaAdoptada = await Adopcion.findOne({
            where: { mascota_id },
            transaction: t
        });
        if (yaAdoptada) {
            throw new AppError('Esta mascota ya fue adoptada', 409);
        }

        return await Adopcion.create(
            { usuario_id, mascota_id },
            { transaction: t }
        );
        // COMMIT automático al salir; ROLLBACK automático si algo lanza
    });
}
```

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
│   ├── dbClient.js             # Conexión PostgreSQL (instancia Sequelize)
│   ├── config.cjs              # Configuración de sequelize-cli (migraciones)
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
│   ├── orm/
│   │   ├── index.js            # Modelos Sequelize + asociaciones
│   │   ├── usuario.js          # Modelo Sequelize: usuarios
│   │   ├── mascota.js          # Modelo Sequelize: mascotas
│   │   └── adopcion.js         # Modelo Sequelize: adopciones
│   ├── adopciones.js           # Repositorio adopciones (transacción, joins)
│   ├── mascotas.js             # Repositorio mascotas (paginación, joins)
│   └── usuario.js              # Repositorio usuarios
│
├── routes/
│   ├── adopciones.js           # POST / y GET / (JWT)
│   ├── mascotas.js             # API REST mascotas (JWT)
│   ├── pages.js                # Rutas de páginas (HTML) + catch-all 404
│   └── usuario.js              # API REST usuarios
│
├── migrations/
│   └── create-tables.cjs        # Migración inicial: usuarios, mascotas y adopciones (idempotente)
│
├── sql/
│   └── init.sql                # Esquema PostgreSQL (referencia; las tablas se crean con migraciones)
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
