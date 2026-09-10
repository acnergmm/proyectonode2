import express from 'express';
import { clientes, siguienteId } from './datos.js';

// Un Router agrupa las rutas de un mismo recurso (aqui, "clientes").
export const router = express.Router();

// ============================================================
//  LAS 5 OPERACIONES DEL CRUD
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
router.get('/', (req, res) => {
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
router.get('/:id', (req, res) => {
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
router.post('/', (req, res) => {
  // Los datos enviados por el cliente llegan en el cuerpo (body).
  // Para poder leerlos hace falta el middleware express.json() (ver server.js).
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
router.put('/:id', (req, res) => {
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
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const posicion = clientes.findIndex((c) => c.id === id);

  if (posicion === -1) {
    return res.status(404).json({ error: `No existe el cliente con id ${id}` });
  }

  // splice elimina 1 elemento a partir de esa posicion.
  const [eliminado] = clientes.splice(posicion, 1);

  res.json({ mensaje: 'Cliente eliminado', cliente: eliminado });
});
