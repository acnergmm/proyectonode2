// ============================================================
//  NUESTRA "BASE DE DATOS": un simple array en memoria
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
// datos de verdad (MySQL, PostgreSQL, MongoDB, sqlite...): la PERSISTENCIA.

export const clientes = [
  { id: 1, nombre: 'Ana Garcia', email: 'ana@ejemplo.com', telefono: '600111222' },
  { id: 2, nombre: 'Luis Perez', email: 'luis@ejemplo.com', telefono: '600333444' },

];

// Contador para asignar el id al crear clientes nuevos.
// Imita el AUTO_INCREMENT de una base de datos real.
let ultimoId = 3;

export function siguienteId() {
  ultimoId = ultimoId + 1;
  return ultimoId;
}
