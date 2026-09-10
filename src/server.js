// ============================================================
//  API REST DE CLIENTES  -  proyecto didactico
// ============================================================
//  Arrancar con:  npm run dev
//  Probar en:     http://localhost:3000/api/clientes
// ============================================================

import express from 'express';

const app = express();
const PUERTO = 3000;


// ============================================================
//  1. NUESTRA "BASE DE DATOS": un simple array en memoria
// ============================================================
//
// Cada objeto del array es como una FILA de una tabla "clientes".
// Las propiedades (id, nombre, email...) son las COLUMNAS.
//
// El campo `id` es la CLAVE PRIMARIA: identifica a cada cliente
// de forma unica y no se repite nunca.
//
// IMPORTANTE: al estar en memoria, los datos se pierden al parar
// el servidor. Ese es justo el problema que resuelve una base de
// datos de verdad (MySQL, PostgreSQL, MongoDB...): la PERSISTENCIA.

const clientes = [
  { id: 1, nombre: 'Ana Garcia', email: 'ana@ejemplo.com', telefono: '600111222' },
  { id: 2, nombre: 'Luis Perez', email: 'luis@ejemplo.com', telefono: '600333444' },
  { id: 3, nombre: 'Marta Ruiz', email: 'marta@ejemplo.com', telefono: '600555666' },
];

// Contador para asignar el id al crear clientes nuevos.
// Imita el AUTO_INCREMENT de una base de datos real.
let ultimoId = 3;

function siguienteId() {
  ultimoId = ultimoId + 1;
  return ultimoId;
}


// ============================================================
//  2. MIDDLEWARES
// ============================================================
//
// Un middleware es una funcion que se ejecuta ANTES de llegar a la ruta.
// Cada peticion los va atravesando en orden, de arriba abajo.

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
//   CRUD          METODO HTTP   RUTA                 SQL equivalente
//   ------------  ------------  -------------------  -----------------
//   Read (todos)  GET           /api/clientes        SELECT *
//   Read (uno)    GET           /api/clientes/:id    SELECT ... WHERE id
//   Create        POST          /api/clientes        INSERT
//   Update        PUT           /api/clientes/:id    UPDATE
//   Delete        DELETE        /api/clientes/:id    DELETE
//
// Fijate en una idea clave de REST: la URL nombra el RECURSO
// (clientes) y el METODO HTTP dice que se hace con el.
// Por eso NO hay rutas tipo /crearCliente o /borrarCliente.


// ------------------------------------------------------------
// READ (todos) -> GET /api/clientes
// ------------------------------------------------------------
app.get('/api/clientes', (req, res) => {
  // Los parametros que van despues de ? en la URL estan en req.query.
  // Ejemplo: /api/clientes?buscar=ana
  const { buscar } = req.query;

  if (buscar) {
    const encontrados = clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(buscar.toLowerCase())
    );
    return res.json(encontrados);
  }

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

  const cliente = clientes.find((c) => c.id === id);

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

  const nuevoCliente = {
    id: siguienteId(),
    nombre,
    email,
    telefono: telefono || null,
  };

  clientes.push(nuevoCliente);

  // 201 Created: se ha creado un recurso nuevo.
  // Se devuelve el cliente creado para que se vea el id asignado.
  res.status(201).json(nuevoCliente);
});


// ------------------------------------------------------------
// UPDATE -> PUT /api/clientes/2
// ------------------------------------------------------------
app.put('/api/clientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email, telefono } = req.body;

  // findIndex nos da la POSICION en el array para poder modificarlo.
  const posicion = clientes.findIndex((c) => c.id === id);

  if (posicion === -1) {
    return res.status(404).json({ error: `No existe el cliente con id ${id}` });
  }

  if (!nombre || !email) {
    return res.status(400).json({ error: 'El nombre y el email son obligatorios' });
  }

  // Sustituimos el cliente, pero conservando su id.
  clientes[posicion] = {
    id,
    nombre,
    email,
    telefono: telefono || null,
  };

  res.json(clientes[posicion]);
});


// ------------------------------------------------------------
// DELETE -> DELETE /api/clientes/2
// ------------------------------------------------------------
app.delete('/api/clientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const posicion = clientes.findIndex((c) => c.id === id);

  if (posicion === -1) {
    return res.status(404).json({ error: `No existe el cliente con id ${id}` });
  }

  // splice elimina 1 elemento a partir de esa posicion.
  const [eliminado] = clientes.splice(posicion, 1);

  res.json({ mensaje: 'Cliente eliminado', cliente: eliminado });
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
