import type { Zona, Mesa, Familia, Articulo, GrupoModificador, LineaOrden } from './mesas.types';

export const DEMO: {
  zonas: Zona[];
  mesas: Mesa[];
  familias: Familia[];
  articulos: Record<number, Articulo[]>;
  modificadores: Record<number, GrupoModificador[]>;
  getLineasDemo: (ordenId: number) => LineaOrden[];
} = {
  zonas: [
    { id: 1, nombre: 'Interior', orden_visual: 1, sucursal_id: 1 },
    { id: 2, nombre: 'Terraza',  orden_visual: 2, sucursal_id: 1 },
    { id: 3, nombre: 'Barra',    orden_visual: 3, sucursal_id: 1 },
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
    { id: 13, nombre: 'T3', estado: 'libre',      zona_id: 2, capacidad: 2, personas: 0, posicion_x: 43, posicion_y: 68 },
    { id: 21, nombre: 'B1', estado: 'libre',      zona_id: 3, capacidad: 4, personas: 0, posicion_x: 28, posicion_y: 40 },
    { id: 22, nombre: 'B2', estado: 'ocupada',    zona_id: 3, capacidad: 4, personas: 3, posicion_x: 68, posicion_y: 40 },
  ],
  familias: [
    { id: 1, nombre: 'Carnes',    color: '#e94560' },
    { id: 2, nombre: 'Bebidas',   color: '#448aff' },
    { id: 3, nombre: 'Postres',   color: '#ff6b6b' },
    { id: 4, nombre: 'Entradas',  color: '#ffab40' },
    { id: 5, nombre: 'Especiales',color: '#00e676' },
  ],
  articulos: {
    1: [
      { id: 101, nombre: 'Churrasco',       precio_venta: 850,  imagen: '🥩', familia_id: 1, tiene_mods: true },
      { id: 102, nombre: 'Lomo Fino',       precio_venta: 950,  imagen: '🥩', familia_id: 1, tiene_mods: true },
      { id: 103, nombre: 'Pollo a la Brasa',precio_venta: 650,  imagen: '🍗', familia_id: 1, tiene_mods: false },
      { id: 104, nombre: 'Costillas BBQ',   precio_venta: 780,  imagen: '🍖', familia_id: 1, tiene_mods: true },
      { id: 105, nombre: 'Filete Miñón',    precio_venta: 1100, imagen: '🥩', familia_id: 1, tiene_mods: true },
      { id: 106, nombre: 'Pechuga Grill',   precio_venta: 580,  imagen: '🍗', familia_id: 1, tiene_mods: false },
    ],
    2: [
      { id: 201, nombre: 'Coca Cola',    precio_venta: 120, imagen: '🥤', familia_id: 2, tiene_mods: false },
      { id: 202, nombre: 'Jugo Natural', precio_venta: 180, imagen: '🍊', familia_id: 2, tiene_mods: true },
      { id: 203, nombre: 'Cerveza Local',precio_venta: 220, imagen: '🍺', familia_id: 2, tiene_mods: false },
      { id: 204, nombre: 'Vino Tinto',   precio_venta: 380, imagen: '🍷', familia_id: 2, tiene_mods: false },
      { id: 205, nombre: 'Agua Mineral', precio_venta: 80,  imagen: '💧', familia_id: 2, tiene_mods: false },
    ],
    3: [
      { id: 301, nombre: 'Flan',    precio_venta: 220, imagen: '🍮', familia_id: 3, tiene_mods: false },
      { id: 302, nombre: 'Brownie', precio_venta: 280, imagen: '🍫', familia_id: 3, tiene_mods: false },
      { id: 303, nombre: 'Helado',  precio_venta: 200, imagen: '🍨', familia_id: 3, tiene_mods: true },
    ],
    4: [
      { id: 401, nombre: 'Ensalada Verde',  precio_venta: 280, imagen: '🥗', familia_id: 4, tiene_mods: false },
      { id: 402, nombre: 'Tabla de Quesos', precio_venta: 450, imagen: '🧀', familia_id: 4, tiene_mods: false },
      { id: 403, nombre: 'Ceviche',         precio_venta: 380, imagen: '🍤', familia_id: 4, tiene_mods: false },
    ],
    5: [
      { id: 501, nombre: 'Chef Especial', precio_venta: 1200, imagen: '⭐',  familia_id: 5, tiene_mods: true },
      { id: 502, nombre: 'Plato del Día', precio_venta: 750,  imagen: '🍽️', familia_id: 5, tiene_mods: false },
    ],
  },
  modificadores: {
    101: [
      { id: 1, nombre: 'Término de Cocción', tipo: 'articulo', seleccion: 'unica', obligatorio: true, min_seleccion: 1, max_seleccion: 1,
        opciones: [
          { id: 1, nombre: 'Poco hecho',  precio_extra: 0 },
          { id: 2, nombre: 'Al punto',    precio_extra: 0 },
          { id: 3, nombre: 'Bien hecho',  precio_extra: 0 },
        ] },
      { id: 2, nombre: 'Acompañamiento', tipo: 'articulo', seleccion: 'unica', obligatorio: false, min_seleccion: 0, max_seleccion: 1,
        opciones: [
          { id: 4, nombre: 'Papas fritas', precio_extra: 0 },
          { id: 5, nombre: 'Arroz',        precio_extra: 0 },
          { id: 6, nombre: 'Ensalada',     precio_extra: 50 },
        ] },
      { id: 3, nombre: 'Extras', tipo: 'articulo', seleccion: 'multiple', obligatorio: false, min_seleccion: 0, max_seleccion: 5,
        opciones: [
          { id: 7, nombre: 'Chimichurri',          precio_extra: 80 },
          { id: 8, nombre: 'Salsa BBQ',            precio_extra: 60 },
          { id: 9, nombre: 'Cebolla caramelizada', precio_extra: 100 },
        ] },
    ],
    102: [
      { id: 4, nombre: 'Término de Cocción', tipo: 'articulo', seleccion: 'unica', obligatorio: true, min_seleccion: 1, max_seleccion: 1,
        opciones: [
          { id: 10, nombre: 'Poco hecho', precio_extra: 0 },
          { id: 11, nombre: 'Al punto',   precio_extra: 0 },
          { id: 12, nombre: 'Bien hecho', precio_extra: 0 },
        ] },
    ],
    202: [
      { id: 5, nombre: 'Sabor', tipo: 'articulo', seleccion: 'unica', obligatorio: true, min_seleccion: 1, max_seleccion: 1,
        opciones: [
          { id: 13, nombre: 'Naranja',  precio_extra: 0 },
          { id: 14, nombre: 'Piña',     precio_extra: 0 },
          { id: 15, nombre: 'Maracuyá', precio_extra: 20 },
        ] },
    ],
  },
  getLineasDemo(ordenId: number): LineaOrden[] {
    return [
      { id: ordenId * 10 + 1, orden_id: ordenId, articulo_id: 101,
        nombre_articulo: 'Churrasco', cantidad: 1, precio_unitario: 850,
        descuento_linea: 0, impuesto_linea: 0,
        subtotal_linea: 850, estado: 'pendiente', enviado_a_cocina: false, cuenta_num: 1,
        modificadores: [{ id: 1, modificador_id: 2, nombre_modificador: 'Al punto', precio_extra: 0 }] },
      { id: ordenId * 10 + 2, orden_id: ordenId, articulo_id: 201,
        nombre_articulo: 'Coca Cola', cantidad: 2, precio_unitario: 120,
        descuento_linea: 0, impuesto_linea: 0,
        subtotal_linea: 240, estado: 'pendiente', enviado_a_cocina: false, cuenta_num: 1,
        modificadores: [] },
    ];
  },
};
