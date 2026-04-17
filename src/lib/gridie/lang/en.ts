import type { FilterOperator } from "../filteringFunctions";

export const en = {
  table: {
    noData: "No data available",
    loading: "Loading data...", 
  },
  sorting: {
    sortAscending: "Sort Ascending",
    sortDescending: "Sort Descending",
    clearSorting: "Clear Sorting",
    clearAllSorting: "Clear All Sorting",
  },
  filtering: {
    operators: {
      contains: "Contains",
      notcontains: "Does not contain",
      startswith: "Starts with",
      endswith: "Ends with",
      equals: "Equals",
      notequal: "Not equal",
      '=': "Equal",
      '<>': "Not equal",
      '<': "Less than",
      '>': "Greater than",
      '<=': "Less than or equal",
      '>=': "Greater than or equal",
      between: "Between",
    } as Record<FilterOperator, string>, // ← Agregar este tipo
    placeholders: {
      string: "Type to filter...",
      number: "Enter a number...",
      date: "Select a date...",
      boolean: "Select...",
      betweenFrom: "From...",
      betweenTo: "To...",
    },
    booleanOptions: {
      true: "Yes",
      false: "No",
    },
    headerFilter: {
      selectAll: "Select all",
      search: "Search...",
      noResults: "No results found",
      count: "items",
      months: {
        0: "January",
        1: "February",
        2: "March",
        3: "April",
        4: "May",
        5: "June",
        6: "July",
        7: "August",
        8: "September",
        9: "October",
        10: "November",
        11: "December",
      } as Record<number, string>, 
    },
  },
  paging: {
    showing: "Showing",
    of: "of",
    items: "items",
    page: "Page",
    jumpTo: "Go to",
    first: "First",
    previous: "Previous",
    next: "Next",
    last: "Last",
  },
};

export type LanguageEN = typeof en;