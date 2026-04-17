import type { Zona, Mesa, Reservacion } from './reservaciones.types';

/** Retorna fecha-hora local en formato datetime-local (YYYY-MM-DDTHH:mm) */
function horasDesdeAhora(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h, 0, 0, 0);
  // toISOString devuelve UTC; ajustamos al offset local
  const offset = d.getTimezoneOffset();
  const local  = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export const DEMO_RV: {
  zonas: Zona[];
  mesas: Mesa[];
  reservaciones: Reservacion[];
} = {
  zonas: [
    { id: 1, nombre: 'Interior' },
    { id: 2, nombre: 'Terraza' },
    { id: 3, nombre: 'Barra' },
  ],

  mesas: [
    { id: 1,  nombre: 'M1', estado: 'libre',      zona_id: 1, capacidad: 4, personas: 0, posicion_x: 15, posicion_y: 19 },
    { id: 2,  nombre: 'M2', estado: 'ocupada',    zona_id: 1, capacidad: 4, personas: 3, posicion_x: 42, posicion_y: 19 },
    { id: 3,  nombre: 'M3', estado: 'libre',      zona_id: 1, capacidad: 2, personas: 0, posicion_x: 70, posicion_y: 19 },
    { id: 4,  nombre: 'M4', estado: 'por_cobrar', zona_id: 1, capacidad: 6, personas: 5, posicion_x: 15, posicion_y: 52 },
    { id: 5,  nombre: 'M5', estado: 'libre',      zona_id: 1, capacidad: 4, personas: 0, posicion_x: 42, posicion_y: 52 },
    { id: 6,  nombre: 'M6', estado: 'reservada',  zona_id: 1, capacidad: 4, personas: 0, posicion_x: 70, posicion_y: 52 },
    { id: 7,  nombre: 'M7', estado: 'ocupada',    zona_id: 1, capacidad: 8, personas: 6, posicion_x: 26, posicion_y: 82 },
    { id: 8,  nombre: 'M8', estado: 'libre',      zona_id: 1, capacidad: 4, personas: 0, posicion_x: 65, posicion_y: 82 },
    { id: 11, nombre: 'T1', estado: 'libre',      zona_id: 2, capacidad: 4, personas: 0, posicion_x: 22, posicion_y: 28 },
    { id: 12, nombre: 'T2', estado: 'ocupada',    zona_id: 2, capacidad: 4, personas: 2, posicion_x: 65, posicion_y: 28 },
    { id: 13, nombre: 'T3', estado: 'reservada',  zona_id: 2, capacidad: 2, personas: 0, posicion_x: 43, posicion_y: 68 },
    { id: 21, nombre: 'B1', estado: 'libre',      zona_id: 3, capacidad: 4, personas: 0, posicion_x: 28, posicion_y: 40 },
    { id: 22, nombre: 'B2', estado: 'ocupada',    zona_id: 3, capacidad: 4, personas: 3, posicion_x: 68, posicion_y: 40 },
  ],

  reservaciones: [
    {
      id: 1,
      mesa_id: 6,
      nombre_cliente: 'Ana Martínez',
      telefono: '+506 8765-4321',
      fecha_hora: horasDesdeAhora(2),
      num_personas: 3,
      notas: 'Celebración de cumpleaños — sin gluten',
      estado: 'pendiente',
    },
    {
      id: 2,
      mesa_id: 13,
      nombre_cliente: 'Carlos Vega',
      telefono: '+506 7654-3210',
      fecha_hora: horasDesdeAhora(4),
      num_personas: 2,
      notas: '',
      estado: 'pendiente',
    },
  ],
};
