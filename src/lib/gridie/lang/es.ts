import type { FilterOperator } from "../filteringFunctions";

export const es = {
  table: {
    noData: "No hay datos disponibles",
    loading: "Cargando datos...", 
  },
  sorting: {
    sortAscending: "Ordenar Ascendente",
    sortDescending: "Ordenar Descendente",
    clearSorting: "Limpiar Ordenamiento",
    clearAllSorting: "Limpiar todo el Ordenamiento",
  },
  filtering: {
    operators: {
      contains: "Contiene",
      notcontains: "No contiene",
      startswith: "Comienza con",
      endswith: "Termina con",
      equals: "Igual a",
      notequal: "No igual a",
      '=': "Igual",
      '<>': "Diferente",
      '<': "Menor que",
      '>': "Mayor que",
      '<=': "Menor o igual",
      '>=': "Mayor o igual",
      between: "Entre",
    } as Record<FilterOperator, string>, // ← Agregar este tipo
    placeholders: {
      string: "Escriba para filtrar...",
      number: "Ingrese un número...",
      date: "Seleccione una fecha...",
      boolean: "Seleccione...",
      betweenFrom: "Desde...",
      betweenTo: "Hasta...",
    },
    booleanOptions: {
      true: "Sí",
      false: "No",
    },
    headerFilter: {
      selectAll: "Seleccionar todos",
      search: "Buscar...",
      noResults: "No se encontraron resultados",
      count: "registros",
      months: {
        0: "Enero",
        1: "Febrero",
        2: "Marzo",
        3: "Abril",
        4: "Mayo",
        5: "Junio",
        6: "Julio",
        7: "Agosto",
        8: "Septiembre",
        9: "Octubre",
        10: "Noviembre",
        11: "Diciembre",
      } as Record<number, string>, 
    },
  },
  paging: {
    showing: "Mostrando",
    of: "de",
    items: "items",
    page: "Página",
    jumpTo: "Ir a",
    first: "Primera",
    previous: "Anterior",
    next: "Siguiente",
    last: "Última",
  },
};

export type LanguageES = typeof es;