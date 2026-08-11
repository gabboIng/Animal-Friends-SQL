#  Animal Friends

Aplicación web fullstack para la adopción de mascotas. Permite a los usuarios registrarse, publicar mascotas disponibles para adopción, editarlas, eliminarlas y navegar por un catálogo paginado.

![Hero Banner](public/img/mascota2.png)

---

##  Características

- **CRUD completo** de mascotas (Crear, Leer, Editar, Eliminar)
- **Autenticación JWT** con registro e inicio de sesión
- **Paginación** del catálogo de mascotas
- **Subida de imágenes** con conversión automática a WebP (Sharp)
- **Diseño responsivo** con Bootstrap 5
- **Alertas interactivas** con SweetAlert2

---

##  Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Backend | Express.js 5, Node.js |
| Base de datos | MongoDB Atlas, Mongoose 9 |
| Motor de plantillas | Handlebars (hbs) |
| Autenticación | JWT, bcrypt |
| Subida de imágenes | Multer, Sharp |
| Frontend | Bootstrap 5, CSS custom, JavaScript vanilla |
| Alertas | SweetAlert2 |
| Gestor de paquetes | pnpm |

---

##  Arquitectura del Proyecto

El proyecto sigue el patrón **MVC** (Modelo-Vista-Controlador) con una capa adicional de schemas para Mongoose.

```mermaid
graph TB
    subgraph "Frontend"
        A[Navegador] -->|HTTP| B[Express.js]
        B -->|HTML + CSS| A
    end

    subgraph "Backend (MVC)"
        B --> C[Routes]
        C --> D[Controllers]
        D --> E[Models]
        E --> F[Mongoose Schemas]
        D --> G[Utils<br/>AppError, catchAsync]
    end

    subgraph "Base de Datos"
        F -->|Mongoose| H[(MongoDB Atlas)]
    end

    subgraph "Archivos"
        D -->|Multer + Sharp| I[uploads/<br/>Imágenes WebP]
    end

    subgraph "Frontend Assets"
        B --> J[public/css/]
        B --> K[public/js/]
        B --> L[public/img/]
    end

    style A fill:#4A90E2,color:#fff
    style H fill:#47A248,color:#fff
    style I fill:#FFD166,color:#000
```

---

##  Base de Datos

La base de datos **adopcion** en MongoDB Atlas contiene dos colecciones:

### Diagrama Entidad-Relación

```mermaid
erDiagram
    USUARIOS {
        ObjectId _id PK
        String nombre
        String apellido
        String email UK
        String clave
        Number telefono
        Date createdAt
        Date updatedAt
    }

    MASCOTAS {
        ObjectId _id PK
        String nombre
        String tipo
        String sexo
        Number edad
        Boolean adoptado
        String imagen
        String descripcion
        Date createdAt
        Date updatedAt
    }

    USUARIOS ||--o{ MASCOTAS : "publica"
```

### Colección: usuarios

| Campo | Tipo | Requisito | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | Identificador único |
| `nombre` | String | Requerido | Nombre del usuario |
| `apellido` | String | Requerido | Apellido del usuario |
| `email` | String | Requerido, único | Email (lowercase, trimmed) |
| `clave` | String | Requerido | Contraseña (hash bcrypt) |
| `telefono` | Number | Opcional | Número de teléfono |
| `createdAt` | Date | Auto | Fecha de creación |
| `updatedAt` | Date | Auto | Fecha de última actualización |

### Colección: mascotas

| Campo | Tipo | Requisito | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | Identificador único |
| `nombre` | String | Requerido | Nombre de la mascota |
| `tipo` | String | Requerido | Tipo (Perro, Gato, Ave, Otro) |
| `sexo` | String | Requerido | Macho o Hembra (enum) |
| `edad` | Number | Requerido | Edad (0-30) |
| `adoptado` | Boolean | Default: false | Estado de adopción |
| `imagen` | String | Opcional | Ruta de la imagen (WebP) |
| `descripcion` | String | Opcional | Descripción de la mascota |
| `createdAt` | Date | Auto | Fecha de creación |
| `updatedAt` | Date | Auto | Fecha de última actualización |

---

##  Flujo del Usuario

### Flujo principal de navegación

```mermaid
flowchart TD
    START([🌐 Inicio]) --> HOME[Página Principal<br/>/]

    HOME -->|No autenticado| LOGIN_OPTIONS{¿Qué desea hacer?}
    LOGIN_OPTIONS -->|Tiene cuenta| LOGIN[Iniciar Sesión<br/>/login]
    LOGIN_OPTIONS -->|No tiene cuenta| REGISTRAR[Registrarse<br/>/registro]

    REGISTRAR -->|POST /usuario/registrar| LOGIN
    LOGIN -->|POST /usuario/login| TOKEN[JWT Token<br/>localStorage]
    TOKEN --> HOME_AUTH[Página Principal<br/>/]

    HOME_AUTH -->|Autenticado| NAV_OPTIONS{Navegación}
    NAV_OPTIONS -->|"+ Agregar Mascota"| CREAR[Crear Mascota<br/>/crear-mascota]
    NAV_OPTIONS -->|Ver catálogo| BROWSE[Explorar Mascotas<br/>Paginación]
    NAV_OPTIONS -->|"Cerrar sesión"| LOGOUT[Logout<br/>localStorage → /]

    CREAR -->|POST /mascotas| UPLOAD[Subir Imagen<br/>Multer + Sharp]
    UPLOAD -->|Guarda en uploads/| DB_CREATE[(MongoDB<br/>Insert)]
    DB_CREATE -->|SweetAlert Éxito| HOME_AUTH

    BROWSE --> CARD{Acciones}
    CARD -->|Click paginación| FETCH[GET /api/mascotas<br/>?page=&limit=]
    FETCH --> REBUILD[Reconstruir Cards]
    REBUILD --> CARD

    CARD -->|" Editar"| MODAL[Modal Bootstrap<br/>Editar Mascota]
    MODAL -->|PUT /mascotas/:id| DB_UPDATE[(MongoDB<br/>Update)]
    DB_UPDATE --> HOME_AUTH

    CARD -->|" Eliminar"| CONFIRM[SweetAlert<br/>¿Eliminar?]
    CONFIRM -->|Sí| DELETE[DELETE /mascotas/:id]
    DELETE --> DEL_FILE[Eliminar Archivo<br/>uploads/]
    DEL_FILE --> DB_DELETE[(MongoDB<br/>Delete)]
    DB_DELETE --> HOME_AUTH

    LOGOUT --> START

    style START fill:#4A90E2,color:#fff
    style HOME fill:#FF6F61,color:#fff
    style HOME_AUTH fill:#FF6F61,color:#fff
    style TOKEN fill:#FFD166,color:#000
    style DB_CREATE fill:#47A248,color:#fff
    style DB_UPDATE fill:#47A248,color:#fff
    style DB_DELETE fill:#47A248,color:#fff
    style CONFIRM fill:#e74c3c,color:#fff
```

### Flujo de autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant DB as MongoDB

    Note over U,DB: Registro
    U->>FE: Completa formulario
    FE->>BE: POST /usuario/registrar
    BE->>BE: bcrypt hash (10 rounds)
    BE->>DB: Guardar usuario
    DB-->>BE: OK
    BE-->>FE: 201 + datos usuario
    FE-->>U: Redirigir a /login

    Note over U,DB: Inicio de Sesión
    U->>FE: Ingresa email + contraseña
    FE->>BE: POST /usuario/login
    BE->>DB: Buscar por email
    DB-->>BE: usuario
    BE->>BE: bcrypt.compare()
    BE->>BE: generarToken() → JWT (1h)
    BE-->>FE: 200 + token + info
    FE->>FE: localStorage.setItem('token')
    FE-->>U: Redirigir a /

    Note over U,DB: Request Autenticado
    U->>FE: Acción protegida (CRUD)
    FE->>BE: Authorization: Bearer {token}
    BE->>BE: verificarToken() middleware
    BE->>BE: Decodificar payload
    BE->>BE: req.usuario = decoded
    BE-->>FE: 200 + datos
```

---

##  Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v11+
- [MongoDB Atlas](https://www.mongodb.com/atlas) (cuenta gratuita)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/gabboIng/Animal-Friends.git
   cd Animal-Friends
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**

   Crear archivo `.env` en la raíz:
   ```env
   PORT=5100
   SERVER_DB=tu_cluster.mongodb.net
   USER_DB=tu_usuario_db
   PASS_DB=tu_contraseña
   DB_HOSTS=host1:27017,host2:27017,host3:27017
   DB_REPLICA_SET=tu_replica_set
   DB_AUTH_SOURCE=admin
   db_Name=adopcion
   JWT_SECRET=tu_secreto_ultra_seguro
   ```

4. **Iniciar el servidor**
   ```bash
   node app.js
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5100
   ```

---

##  Estructura del Proyecto

```
Animal-Friends/
├── app.js                    # Punto de entrada
├── .env                      # Variables de entorno (no commitear)
├── package.json
│
├── config/
│   ├── dbClient.js           # Conexión MongoDB (Mongoose)
│   ├── multer.js             # Config subida de archivos
│   └── procesarImagen.js     # Conversión imágenes → WebP
│
├── controllers/
│   ├── mascotas.js           # CRUD mascotas
│   └── usuario.js            # Registro + Login
│
├── helpers/
│   └── autenticacion.js      # JWT: generarToken + verificarToken
│
├── middlewares/
│   └── errorHandler.js       # Manejo global de errores
│
├── models/
│   ├── mascotas.js           # Modelo mascotas (paginación, CRUD)
│   └── usuario.js            # Modelo usuarios
│
├── routes/
│   ├── mascotas.js           # API REST mascotas
│   ├── pages.js              # Rutas de páginas (HTML)
│   └── usuario.js            # API REST usuarios
│
├── schema/
│   ├── mascotas.js           # Schema Mongoose mascotas
│   └── usuarios.js           # Schema Mongoose usuarios
│
├── utils/
│   ├── AppError.js           # Clase error personalizada
│   └── catchAsync.js         # Wrapper async/await
│
├── public/
│   ├── css/                  # Estilos (shared, home, login, registro, crear-mascota)
│   ├── img/                  # Imágenes estáticas
│   └── js/                   # Scripts del cliente (paginador, login, registro, crear-mascota)
│
├── uploads/                  # Imágenes subidas (no commitear)
│
└── views/
    ├── home.hbs              # Página principal + catálogo + modal editar
    ├── login.hbs             # Inicio de sesión
    ├── registro.hbs          # Registro de usuario
    ├── crear-mascota.hbs     # Formulario crear mascota
    └── partials/
        ├── header.hbs        # Navbar (links condicionales)
        └── footer.hbs        # Footer + CDN SweetAlert2 + scripts
```

---

## 🌐 API Routes

### Páginas (HTML)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Página principal con catálogo paginado |
| `GET` | `/login` | Página de inicio de sesión |
| `GET` | `/registro` | Página de registro |
| `GET` | `/crear-mascota` | Formulario para crear mascota |

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

---

##  Autor

**gabboIng** — [GitHub](https://github.com/gabboIng)
