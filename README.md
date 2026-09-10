# API de Clientes — proyecto didáctico

API REST hecha con Node.js y Express para practicar los conceptos básicos de
una API: rutas, métodos HTTP, códigos de estado, JSON y CRUD.

Los datos se guardan en una base de datos **SQLite**, que viene incluida en Node
(`node:sqlite`), así que no hay que instalar ni configurar ningún servidor de
base de datos.

## Puesta en marcha

```bash
npm install     # instalar dependencias (solo la primera vez)
npm run dev     # arrancar el servidor y reiniciarlo al guardar cambios
```

El servidor queda escuchando en http://localhost:3000

La primera vez se crea solo el archivo `clientes.db` con la tabla y 3 clientes
de ejemplo. Para comprobar que funciona, abre en el navegador:
http://localhost:3000/api/clientes

## Archivos del proyecto

| Archivo | Qué contiene |
|---|---|
| `src/server.js` | Todo el código: la base de datos, los middlewares y las 5 rutas del CRUD |
| `clientes.db` | La base de datos. Se crea sola al arrancar |
| `peticiones.http` | Peticiones de ejemplo para probar la API |

Todo el código está en un único archivo, y por dentro se lee de arriba abajo en
4 bloques: la base de datos, los middlewares, las rutas del CRUD y el arranque.

## Los 5 endpoints

| Operación CRUD | Método | Ruta | SQL que ejecuta |
|---|---|---|---|
| Read (todos) | GET | `/api/clientes` | `SELECT * FROM clientes` |
| Read (uno) | GET | `/api/clientes/:id` | `SELECT * FROM clientes WHERE id = ?` |
| Create | POST | `/api/clientes` | `INSERT INTO clientes ...` |
| Update | PUT | `/api/clientes/:id` | `UPDATE clientes SET ... WHERE id = ?` |
| Delete | DELETE | `/api/clientes/:id` | `DELETE FROM clientes WHERE id = ?` |

La idea central de REST: **la URL nombra el recurso** (`clientes`) y **el método
HTTP dice qué se hace con él**. Por eso no existen rutas como `/crearCliente`.

## Códigos de estado que usa la API

| Código | Significado | Cuándo lo devuelve |
|---|---|---|
| 200 OK | Todo correcto | GET, PUT y DELETE que funcionan |
| 201 Created | Recurso creado | POST que crea un cliente |
| 400 Bad Request | La petición está mal | Falta el nombre o el email |
| 404 Not Found | No existe | Un id o una ruta que no existen |
| 409 Conflict | Choca con lo que ya hay | Un email que ya tiene otro cliente |

## Cómo probar la API

Desde el navegador solo se pueden hacer peticiones GET. Para POST, PUT y DELETE
usa una de estas opciones:

- **VS Code**: abre `peticiones.http` con la extensión *REST Client* (la más cómoda para clase)
- **Postman** o **Thunder Client**
- **curl** desde la terminal:

```bash
# Listar
curl http://localhost:3000/api/clientes

# Crear
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Pedro Sanz\",\"email\":\"pedro@ejemplo.com\"}"

# Borrar
curl -X DELETE http://localhost:3000/api/clientes/3
```

## De dónde salen los datos de una petición

Es lo que más confunde al principio. Hay tres sitios distintos:

| Dónde | Ejemplo | Cómo se lee |
|---|---|---|
| Ruta | `/api/clientes/2` → el `2` | `req.params.id` |
| Query (después de `?`) | `/api/clientes?buscar=ana` → el `ana` | `req.query.buscar` |
| Cuerpo (body) | El JSON de un POST | `req.body` |

Los dos primeros llegan **siempre como texto**, por eso el id se convierte con
`Number()`. El body solo se puede leer gracias al middleware `express.json()`.

## CORS: llamar a la API desde una página web

Por seguridad, el navegador bloquea que una web haga peticiones a una dirección
distinta de la suya (otro dominio, **otro puerto** o http/https). Es el caso
típico de clase: un HTML abierto con Live Server en el puerto 5500 que hace
`fetch()` a esta API del puerto 3000.

La línea `app.use(cors())` de `server.js` añade las cabeceras que le dicen al
navegador que esas llamadas están permitidas.

```js
// Desde un HTML abierto con Live Server (puerto 5500)
fetch('http://localhost:3000/api/clientes')
  .then((res) => res.json())
  .then((clientes) => console.log(clientes));
```

Dos detalles que suelen confundir:

- `cors()` sin opciones abre la API a **cualquier** web. Para aprender está
  bien; en producción se limita: `app.use(cors({ origin: 'https://mitienda.com' }))`.
- **curl, Postman y REST Client no aplican CORS**, porque no son navegadores.
  Si las pruebas te funcionan ahí pero fallan desde el HTML, el problema es CORS.

## La base de datos

### La tabla

```sql
CREATE TABLE clientes (
  id       INTEGER PRIMARY KEY,   -- clave primaria, se asigna sola
  nombre   TEXT NOT NULL,         -- obligatorio
  email    TEXT NOT NULL UNIQUE,  -- obligatorio y sin repetir
  telefono TEXT                   -- opcional
);
```

Cada fila es un cliente y cada columna un dato suyo. Las **restricciones**
(`NOT NULL`, `UNIQUE`) las vigila la propia base de datos: aunque el código
tuviera un fallo, no dejaría guardar dos clientes con el mismo email.

Toda la base de datos es un único archivo, `clientes.db`. Se puede abrir con la
extensión *SQLite Viewer* de VS Code para ver la tabla por dentro.

### Los tres métodos para consultar

| Método | Qué devuelve | Para qué |
|---|---|---|
| `.all()` | Todas las filas (array) | `SELECT` de varios |
| `.get()` | Una fila, o `undefined` | `SELECT` de uno |
| `.run()` | Cuántas filas cambió | `INSERT`, `UPDATE`, `DELETE` |

Tras un `INSERT`, `.run()` devuelve además `lastInsertRowid`: el id que la base
de datos le ha asignado a la fila nueva.

Tras un `UPDATE` o un `DELETE`, devuelve `changes`: cuántas filas se han tocado.
Si vale 0, es que no existía ninguna fila con ese id, y por eso la API responde
404.

### Las consultas preparadas y la inyección SQL

Los datos **nunca** se pegan dentro del texto del SQL. Se escribe un `?` y el
valor se pasa aparte:

```js
// BIEN
db.prepare('SELECT * FROM clientes WHERE id = ?').get(id)

// MAL
db.prepare('SELECT * FROM clientes WHERE id = ' + id).get()
```

Si se concatena el texto, alguien puede enviar como id algo así:

```
1; DROP TABLE clientes
```

...y borrar la tabla entera. Eso es una **inyección SQL**, el fallo de seguridad
más clásico de una API. Con `?`, la base de datos trata el valor siempre como un
dato, nunca como una instrucción.

## Ejercicios propuestos

1. Añadir la columna `ciudad` a la tabla y devolverla en todas las respuestas.
2. Validar que el email contenga una `@`; si no, responder 400.
3. Ordenar el listado por nombre en vez de por id (`ORDER BY nombre`).
4. Buscar también por email, no solo por nombre (`WHERE nombre LIKE ? OR email LIKE ?`).
5. Añadir el método `PATCH` para modificar solo un campo, sin enviar el cliente entero.
6. Separar el código en varios archivos (la base de datos por un lado, las rutas por otro).
7. Crear una segunda tabla `pedidos` con una columna `cliente_id` que apunte a
   `clientes.id` (una **clave foránea**) y montar su CRUD.
8. Hacer un `index.html` que liste los clientes con `fetch()` y un formulario
   para crear uno nuevo (aquí es donde se ve para qué sirve CORS).
