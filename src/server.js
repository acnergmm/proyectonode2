import express from 'express';
import { router as clientesRouter } from './clientes.rutas.js';

// Creamos la aplicacion de Express.
const app = express();
const PUERTO = 3000;

// ============================================================
//  MIDDLEWARES
// ============================================================
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
//  RUTAS
// ============================================================

// Todas las rutas del router se montan bajo /api/clientes.
// Asi, el router.get('/') de dentro responde a GET /api/clientes
app.use('/api/clientes', clientesRouter);

// Si ninguna ruta anterior ha respondido, la URL no existe -> 404.
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.url}` });
});

// ============================================================
//  ARRANQUE DEL SERVIDOR
// ============================================================

app.listen(PUERTO, () => {
  console.log(`Servidor arrancado en http://localhost:${PUERTO}`);
  console.log(`Prueba a abrir http://localhost:${PUERTO}/api/clientes`);
});
