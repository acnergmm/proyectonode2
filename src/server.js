// ============================================================
//  API REST DE CLIENTES  -  proyecto didactico
//  Ahora con base de datos SQLite
// ============================================================
//  Arrancar con:  npm run dev
//  Probar en:     http://localhost:3000/api/clientes
// ============================================================

import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

const app = express();
const PUERTO = 3000;


// ============================================================
//  1. LA BASE DE DATOS
// ============================================================
//
// SQLite viene incluido en Node, asi que no hay que instalar nada:
// se importa con `node:sqlite`.
//
// Toda la base de datos es UN SOLO ARCHIVO (clientes.db) que se crea
// solo la primera vez. Puedes abrirlo con la extension "SQLite Viewer"
// de VS Code para ver la tabla por dentro.
//
// La gran diferencia con el array en memoria de antes: ahora los datos
// SIGUEN AHI aunque pares el servidor. Eso es la PERSISTENCIA.

const db = new DatabaseSync(join(import.meta.dirname, '..', 'clientes.db'));


// --- Crear la tabla (el ESQUEMA) ---------------------------
//
// "IF NOT EXISTS" hace que solo se cree la primera vez.
//
// Cada columna declara su TIPO y sus RESTRICCIONES:
//   INTEGER PRIMARY KEY  -> clave primaria; SQLite le asigna el numero solo
//                           (es el AUTO_INCREMENT del que hablabamos)
//   NOT NULL             -> ese campo es obligatorio
//   UNIQUE               -> no puede repetirse en dos filas
//
// Fijate en que la propia base de datos ya protege los datos: aunque
// nuestro codigo tuviera un fallo, no dejaria guardar dos clientes
// con el mismo email.

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id       INTEGER PRIMARY KEY,
    nombre   TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    telefono TEXT
  )
`);


// --- Datos de ejemplo (solo si la tabla esta vacia) ---------

const { total } = db.prepare('SELECT COUNT(*) AS total FROM clientes').get();

if (total === 0) {
  const insertar = db.prepare(
    'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)'
  );
  insertar.run('Ana Garcia', 'ana@ejemplo.com', '600111222');
  insertar.run('Luis Perez', 'luis@ejemplo.com', '600333444');
  insertar.run('Marta Ruiz', 'marta@ejemplo.com', '600555666');
  console.log('Base de datos creada con 3 clientes de ejemplo');
}


// ============================================================
//  2. MIDDLEWARES
// ============================================================
//
// Un middleware es una funcion que se ejecuta ANTES de llegar a la ruta.
// Cada peticion los va atravesando en orden, de arriba abajo.

// CORS permite que una pagina web alojada en OTRA direccion pueda llamar
// a esta API. Por seguridad, el navegador bloquea por defecto las peticiones
// entre origenes distintos (otro dominio, otro puerto o http/https).
//
// Ejemplo tipico en clase: el HTML abierto en el puerto 5500 con Live Server
// hace fetch() a esta API del puerto 3000. Son origenes distintos, asi que
// sin esta linea el navegador rechaza la respuesta con un error de CORS.
//
// Ojo: cors() sin opciones abre la API a CUALQUIER web. Va bien para
// aprender; en produccion se limita a los dominios de confianza:
//   app.use(cors({ origin: 'https://mitienda.com' }));
//
// Curiosidad util: curl, Postman y el REST Client de VS Code NO aplican
// CORS, porque no son navegadores. Por eso las pruebas funcionaban igual
// antes de anadir esto.
app.use(cors());

// Lee el cuerpo JSON de las peticiones y lo deja listo en req.body.
// Sin esta linea, req.body seria undefined en los POST y PUT.
app.use(express.json());

// Middleware propio: escribe en consola cada peticion que llega.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // next() pasa el control al siguiente paso; si se olvida, la peticion se queda colgada
});


// ============================================================
//  3. LAS 5 OPERACIONES DEL CRUD
// ============================================================
//
//   CRUD          METODO HTTP   RUTA                 SQL
//   ------------  ------------  -------------------  -----------------
//   Read (todos)  GET           /api/clientes        SELECT
//   Read (uno)    GET           /api/clientes/:id    SELECT ... WHERE
//   Create        POST          /api/clientes        INSERT
//   Update        PUT           /api/clientes/:id    UPDATE
//   Delete        DELETE        /api/clientes/:id    DELETE
//
// Idea clave de REST: la URL nombra el RECURSO (clientes) y el METODO
// HTTP dice que se hace con el. Por eso no hay rutas /crearCliente.
//
// ------------------------------------------------------------
//  CONSULTAS PREPARADAS: los interrogantes (?)
// ------------------------------------------------------------
// Fijate en que los datos NUNCA se pegan dentro del texto del SQL.
// Se escribe un ? y el valor se pasa aparte, en .get() o .run():
//
//   BIEN:  db.prepare('SELECT * FROM clientes WHERE id = ?').get(id)
//   MAL:   db.prepare('SELECT * FROM clientes WHERE id = ' + id).get()
//
// Si se concatena el texto, alguien puede enviar un id como
// "1; DROP TABLE clientes" y borrarte la tabla entera. Eso se llama
// INYECCION SQL y es el fallo de seguridad mas clasico de una API.
// Con ? la base de datos trata el valor siempre como dato, nunca
// como instruccion.
//
// Los tres metodos que usaremos:
//   .all()  -> devuelve TODAS las filas que coinciden (un array)
//   .get()  -> devuelve UNA fila (o undefined si no hay ninguna)
//   .run()  -> ejecuta sin devolver filas (INSERT, UPDATE, DELETE)


// ------------------------------------------------------------
// READ (todos) -> GET /api/clientes
// ------------------------------------------------------------
app.get('/api/clientes', (req, res) => {
  // Los parametros que van despues de ? en la URL estan en req.query.
  // Ejemplo: /api/clientes?buscar=ana
  const { buscar } = req.query;

  if (buscar) {
    // LIKE busca coincidencias parciales y % significa "cualquier cosa".
    // Asi, %ana% encuentra tanto "Ana Garcia" como "Mariana".
    const encontrados = db
      .prepare('SELECT * FROM clientes WHERE nombre LIKE ? ORDER BY id')
      .all(`%${buscar}%`);

    return res.json(encontrados);
  }

  const clientes = db.prepare('SELECT * FROM clientes ORDER BY id').all();

  // res.json() convierte el array a JSON y responde con 200 OK.
  res.json(clientes);
});


// ------------------------------------------------------------
// READ (uno) -> GET /api/clientes/2
// ------------------------------------------------------------
app.get('/api/clientes/:id', (req, res) => {
  // :id es un parametro de ruta y llega en req.params.
  // Siempre llega como TEXTO, por eso lo pasamos a numero.
  const id = Number(req.params.id);

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);

  if (!cliente) {
    // 404 Not Found: el recurso pedido no existe.
    return res.status(404).json({ error: `No existe el cliente con id ${id}` });
  }

  res.json(cliente);
});


// ------------------------------------------------------------
// CREATE -> POST /api/clientes
// ------------------------------------------------------------
app.post('/api/clientes', (req, res) => {
  // Los datos enviados por el cliente llegan en el cuerpo (body).
  // Para poder leerlos hace falta el middleware express.json() de arriba.
  const { nombre, email, telefono } = req.body;

  // Validacion: nunca te fies de los datos que llegan de fuera.
  if (!nombre || !email) {
    // 400 Bad Request: la peticion esta mal hecha.
    return res.status(400).json({ error: 'El nombre y el email son obligatorios' });
  }

  // El email es UNIQUE en la tabla, asi que si se repite la base de datos
  // lanza un error. Lo capturamos con try/catch para responder con un
  // mensaje claro en vez de que se caiga el servidor.
  try {
    const resultado = db
      .prepare('INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)')
      .run(nombre, email, telefono || null);

    // Al insertar, SQLite nos dice que id le ha asignado a la fila nueva.
    const nuevoCliente = db
      .prepare('SELECT * FROM clientes WHERE id = ?')
      .get(resultado.lastInsertRowid);

    // 201 Created: se ha creado un recurso nuevo.
    res.status(201).json(nuevoCliente);
  } catch (error) {
    // 409 Conflict: los datos son correctos, pero chocan con lo que ya existe.
    res.status(409).json({ error: `Ya existe un cliente con el email ${email}` });
  }
});


// ------------------------------------------------------------
// UPDATE -> PUT /api/clientes/2
// ------------------------------------------------------------
app.put('/api/clientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email, telefono } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'El nombre y el email son obligatorios' });
  }

  try {
    const resultado = db
      .prepare('UPDATE clientes SET nombre = ?, email = ?, telefono = ? WHERE id = ?')
      .run(nombre, email, telefono || null, id);

    // .changes dice cuantas filas se han modificado.
    // Si es 0, es que no habia ninguna fila con ese id.
    if (resultado.changes === 0) {
      return res.status(404).json({ error: `No existe el cliente con id ${id}` });
    }

    const actualizado = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    res.json(actualizado);
  } catch (error) {
    res.status(409).json({ error: `Ya existe otro cliente con el email ${email}` });
  }
});


// ------------------------------------------------------------
// DELETE -> DELETE /api/clientes/2
// ------------------------------------------------------------
app.delete('/api/clientes/:id', (req, res) => {
  const id = Number(req.params.id);

  // Leemos el cliente ANTES de borrarlo, para poder devolverlo en la respuesta.
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);

  if (!cliente) {
    return res.status(404).json({ error: `No existe el cliente con id ${id}` });
  }

  db.prepare('DELETE FROM clientes WHERE id = ?').run(id);

  res.json({ mensaje: 'Cliente eliminado', cliente });
});


// ------------------------------------------------------------
// Si ninguna ruta anterior ha respondido, la URL no existe -> 404.
// ------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.url}` });
});


// ============================================================
//  4. ARRANQUE DEL SERVIDOR
// ============================================================

app.listen(PUERTO, () => {
  console.log(`Servidor arrancado en http://localhost:${PUERTO}`);
  console.log(`Prueba a abrir http://localhost:${PUERTO}/api/clientes`);
});
