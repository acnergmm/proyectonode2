# API de Clientes — proyecto didáctico

API REST hecha con Node.js y Express para practicar los conceptos básicos de
una API: rutas, métodos HTTP, códigos de estado, JSON y CRUD.

Los datos se guardan **en memoria** (un array de JavaScript), sin base de datos.
Al parar el servidor los cambios se pierden: eso es justamente lo que
resolveremos más adelante con una base de datos real.

## Puesta en marcha

```bash
npm install     # instalar dependencias (solo la primera vez)
npm run dev     # arrancar el servidor y reiniciarlo al guardar cambios
```

El servidor queda escuchando en http://localhost:3000

Para comprobar que funciona, abre en el navegador:
http://localhost:3000/api/clientes

## Archivos del proyecto

| Archivo | Qué contiene |
|---|---|
| `src/server.js` | Configura Express, los middlewares y arranca el servidor |
| `src/clientes.rutas.js` | Las 5 operaciones del CRUD de clientes |
| `src/datos.js` | El array que hace de "base de datos" |
| `peticiones.http` | Peticiones de ejemplo para probar la API |

## Los 5 endpoints

| Operación CRUD | Método | Ruta | Qué hace |
|---|---|---|---|
| Read (todos) | GET | `/api/clientes` | Devuelve la lista de clientes |
| Read (uno) | GET | `/api/clientes/:id` | Devuelve un cliente por su id |
| Create | POST | `/api/clientes` | Crea un cliente nuevo |
| Update | PUT | `/api/clientes/:id` | Modifica un cliente existente |
| Delete | DELETE | `/api/clientes/:id` | Borra un cliente |

La idea central de REST: **la URL nombra el recurso** (`clientes`) y **el método
HTTP dice qué se hace con él**. Por eso no existen rutas como `/crearCliente`.

## Códigos de estado que usa la API

| Código | Significado | Cuándo lo devuelve |
|---|---|---|
| 200 OK | Todo correcto | GET, PUT y DELETE que funcionan |
| 201 Created | Recurso creado | POST que crea un cliente |
| 400 Bad Request | La petición está mal | Falta el nombre o el email |
| 404 Not Found | No existe | Un id o una ruta que no existen |

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

## Puente hacia la base de datos

Cada operación del CRUD equivale a una sentencia SQL. Cuando cambiemos el array
por una base de datos real, lo único que cambia es el interior de cada ruta:

| En `clientes.rutas.js` | En SQL |
|---|---|
| `clientes` | `SELECT * FROM clientes` |
| `clientes.find(c => c.id === id)` | `SELECT * FROM clientes WHERE id = ?` |
| `clientes.push(nuevo)` | `INSERT INTO clientes (...) VALUES (...)` |
| `clientes[posicion] = {...}` | `UPDATE clientes SET ... WHERE id = ?` |
| `clientes.splice(posicion, 1)` | `DELETE FROM clientes WHERE id = ?` |

En el array, cada objeto es una **fila** y cada propiedad una **columna**.
El `id` es la **clave primaria** y la función `siguienteId()` imita al
`AUTO_INCREMENT`.

## Ejercicios propuestos

1. Añadir el campo `ciudad` a los clientes y devolverlo en todas las respuestas.
2. Validar que el email contenga una `@`; si no, responder 400.
3. Impedir que se creen dos clientes con el mismo email (responder 409 Conflict).
4. Crear el endpoint `GET /api/clientes/activos` filtrando por un campo `activo`.
5. Repetir el CRUD completo para un recurso nuevo: `/api/productos`.
6. Sustituir el array de `datos.js` por una base de datos real (SQLite o MongoDB).
