# Reflexión técnica — Node & Express Web App (Módulo 7)

> Documento breve que justifica las decisiones técnicas más relevantes del proyecto
> **Animal Friends** (aplicación de adopción de mascotas). Complementa las capturas
> de Postman y el `README.md`.

## 1. ¿Por qué Sequelize (ORM) y no solo SQL manual?

Se usó **Sequelize** como capa de acceso a datos porque:

- Centraliza las asociaciones (`Usuario 1:N Mascota`, `Mascota 1:1 Adopcion`) en un solo archivo (`models/orm/index.js`), evitando repetir JOINs en cada consulta.
- Genera consultas parámetrizadas de forma segura (reduce riesgo de inyección SQL).
- Las **migraciones** versionan el esquema: `pnpm db:migrate` aplica y `db:migrate:undo` deshace, algo que un `init.sql` estático no permite.

El archivo `sql/init.sql` se conserva como referencia académica y para demostrar la
comparación "SQL manual vs ORM" documentada en el README (mismo resultado con
`json_agg` y con `include`).

## 2. Transacciones y consistencia

La adopción de una mascota es una operación que combina **verificar + insertar**.
Implementé la lógica dentro de `sequelize.transaction()` con bloqueo de fila
(`lock: t.LOCK.UPDATE`, equivalente a `SELECT ... FOR UPDATE`) para evitar que dos
usuarios adopten la misma mascota al mismo tiempo. Si alguna acción falla, la
transacción hace **rollback** automático.

Además, las transacciones fallidas se registran en `logs/transacciones-fallidas.log`
(operación, fecha y motivo) para poder auditar qué operación y por qué no se completó.

## 3. Soft delete: ¿por qué no borrado físico?

El esquema original usaba `ON DELETE CASCADE`, lo que implicaba que **borrar un
usuario eliminaba físicamente sus mascotas y las adopciones de otros usuarios**,
destruyendo historia. La solución fue:

1. Agregar la columna `activo` a `usuarios`, `mascotas` y `adopciones`.
2. Al "eliminar" un usuario, se desactivan sus datos dentro de una transacción.
3. Validar antes: si el usuario tiene **adopciones gestionadas por otros**, el borrado se bloquea con **409**, para no invalidar el historial de terceros.

Beneficios: los listados filtran `activo = true`, se preserva la trazabilidad y no se
pierde consistencia referencial. El trade-off es que la BD crece, pero para este
dominio es más importante el historial.

## 4. Autenticación y privilegios (JWT + roles)

- Las contraseñas se guardan con **bcrypt** y la API nunca las expone (`attributes: { exclude: ['clave'] }`).
- El token JWT incluye el campo `rol`. El middleware `esAdmin` restringe las rutas
  `/admin` y devuelve **403** si el token no tiene rol `admin`.
- Cambiar el rol de una cuenta exige volver a iniciar sesión (el rol va dentro del token).

## 5. Subida de archivos

Se usa **Multer** (máx. 10 MB, validación de tipo de archivo) y **Sharp** para
convertir las imágenes a **WebP**, optimizando el peso en el catálogo.

## 6. Arquitectura

El proyecto sigue una separación por capas: **routes → controllers → models
(repositorios → ORM)**. Esto permite reutilizar la lógica de consulta desde el API y
desde las vistas, y mantener cada responsabilidad en un archivo pequeño y con nombre
representativo.

## 7. Decisiones de diseño normalizado

La mascota "adoptada" **no** se guarda como columna de estado; se deduce de la
existencia de la fila en `adopciones` (una sola fuente de verdad) más el `UNIQUE(mascota_id)`
como respaldo ante concurrencia.