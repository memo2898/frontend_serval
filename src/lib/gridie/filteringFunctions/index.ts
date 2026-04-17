// src/gridie/filteringFunctions/index.ts

export type FilterOperator = 
  | 'contains' | 'notcontains' | 'startswith' | 'endswith' | 'equals' | 'notequal'
  | '=' | '<>' | '<' | '>' | '<=' | '>=' | 'between'
  | 'in' | 'notin' 
  | 'year' | 'month' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'last';
export interface FilterState {
  columnIndex: number;
  operator: FilterOperator;
  value: any;
  value2?: any;
  unit?: "days" | "months" | "years"; 
  year?: number; 
}


export interface HeaderFilterState {
  columnIndex: number;
  selectedValues: Set<any>; // Valores seleccionados en checkboxes
}

export class FilteringManager {
  private filterStates: FilterState[] = [];
  private headerFilterStates: HeaderFilterState[] = []; 

  // ============= FILTER ROW (existente) =============
  
  addFilter(columnIndex: number, operator: FilterOperator, value: any, value2?: any, unit?: string, year?: number): void {
    const existingIndex = this.filterStates.findIndex(f => f.columnIndex === columnIndex);
    
    if (existingIndex !== -1) {
      this.filterStates[existingIndex] = { columnIndex, operator, value, value2, unit: unit as any, year };
    } else {
      this.filterStates.push({ columnIndex, operator, value, value2, unit: unit as any, year });
    }
  }

  clearFilterValue(columnIndex: number): void {
    this.filterStates = this.filterStates.filter(f => f.columnIndex !== columnIndex);
  }

  clearAll(): void {
    this.filterStates = [];
    this.headerFilterStates = []; 
  }

  getColumnFilter(columnIndex: number): FilterState | null {
    return this.filterStates.find(f => f.columnIndex === columnIndex) || null;
  }

  getAllFilters(): FilterState[] {
    return [...this.filterStates];
  }

  // ============= HEADER FILTER (nuevo) =============

  setHeaderFilterValues(columnIndex: number, selectedValues: Set<any>): void {
    const existingIndex = this.headerFilterStates.findIndex(f => f.columnIndex === columnIndex);
    
    if (existingIndex !== -1) {
      this.headerFilterStates[existingIndex].selectedValues = selectedValues;
    } else {
      this.headerFilterStates.push({ columnIndex, selectedValues });
    }
  }

  //  Obtener valores seleccionados de una columna
  getHeaderFilterValues(columnIndex: number): Set<any> {
    const state = this.headerFilterStates.find(f => f.columnIndex === columnIndex);
    return state ? state.selectedValues : new Set();
  }

  //  Limpiar Header Filter de una columna
  clearHeaderFilter(columnIndex: number): void {
    this.headerFilterStates = this.headerFilterStates.filter(f => f.columnIndex !== columnIndex);
  }

  //  Verificar si hay filtros activos en Header Filter
  hasActiveHeaderFilter(columnIndex: number): boolean {
    const state = this.headerFilterStates.find(f => f.columnIndex === columnIndex);
    return state ? state.selectedValues.size > 0 : false;
  }

  // ============= APPLY FILTERS (actualizado) =============

  applyFilters(data: any[], headers: any[]): any[] {
    let filteredData = [...data];

    // Aplicar Filter Row
    this.filterStates.forEach(filter => {
      const header = headers[filter.columnIndex];
      filteredData = filteredData.filter(row => {
        const cellValue = this.getCellValue(row, filter.columnIndex);
        return this.evaluateFilter(cellValue, filter, header.type);
      });
    });

    //  Aplicar Header Filter
    this.headerFilterStates.forEach(filter => {
      if (filter.selectedValues.size === 0) return; // Sin selección = sin filtro

      const header = headers[filter.columnIndex];
      filteredData = filteredData.filter(row => {
        const cellValue = this.getCellValue(row, filter.columnIndex);
        
        // Iterar sobre los valores seleccionados
        for (const selectedValue of filter.selectedValues) {
          // Si es un parameter con operador
          if (typeof selectedValue === 'object' && selectedValue.operator) {
            if (this.evaluateFilter(cellValue, selectedValue, header.type)) {
              return true;
            }
          } else {
            // Es un valor simple
            if (this.compareValues(cellValue, selectedValue, '=', header.type)) {
              return true;
            }
          }
        }
        
        return false; // No coincide con ningún valor seleccionado
      });
    });

    return filteredData;
  }

  // ============= HELPER METHODS (existentes + actualizados) =============

 private getCellValue(row: any, columnIndex: number): any {
  if (Array.isArray(row)) {
    return row[columnIndex];
  }
  
  // ✅ Excluir identityField
  const keys = Object.keys(row).filter(key => key !== 'identityField');
  const key = keys[columnIndex];
  
  return row[key];
}


  private normalizeString(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  public evaluateFilter(cellValue: any, filter: FilterState, type?: string): boolean {
    if (cellValue === null || cellValue === undefined) return false;

    const { operator, value, value2, unit, year } = filter;

    // String operators
    if (operator === 'contains') {
      return this.normalizeString(String(cellValue)).includes(this.normalizeString(String(value)));
    }
    if (operator === 'notcontains') {
      return !this.normalizeString(String(cellValue)).includes(this.normalizeString(String(value)));
    }
    if (operator === 'startswith') {
      return this.normalizeString(String(cellValue)).startsWith(this.normalizeString(String(value)));
    }
    if (operator === 'endswith') {
      return this.normalizeString(String(cellValue)).endsWith(this.normalizeString(String(value)));
    }
    if (operator === 'equals') {
      return this.normalizeString(String(cellValue)) === this.normalizeString(String(value));
    }
    if (operator === 'notequal') {
      return this.normalizeString(String(cellValue)) !== this.normalizeString(String(value));
    }

    //  Array operator
    if (operator === 'in') {
      const arrayValue = Array.isArray(value) ? value : [value];
      return arrayValue.some(v => this.compareValues(cellValue, v, '=', type));
    }

    // Number/Date operators
    if (operator === 'between') {
      return this.compareValues(cellValue, value, '>=', type) && 
             this.compareValues(cellValue, value2, '<=', type);
    }

    //  Date operators
    if (type === 'date' || type === 'datetime') {
      const cellDate = new Date(cellValue);
      const now = new Date();

      switch (operator) {
        case 'today':
          return this.isSameDay(cellDate, now);
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return this.isSameDay(cellDate, yesterday);
        case 'thisWeek':
          return this.isThisWeek(cellDate);
        case 'thisMonth':
          return cellDate.getMonth() === now.getMonth() && cellDate.getFullYear() === now.getFullYear();
        case 'thisYear':
          return cellDate.getFullYear() === now.getFullYear();
        case 'year':
          return cellDate.getFullYear() === value;
        case 'month':
          return cellDate.getMonth() === value && (year ? cellDate.getFullYear() === year : true);
        case 'last':
          if (unit === 'days') {
            const daysAgo = new Date(now);
            daysAgo.setDate(daysAgo.getDate() - value);
            return cellDate >= daysAgo;
          }
          if (unit === 'months') {
            const monthsAgo = new Date(now);
            monthsAgo.setMonth(monthsAgo.getMonth() - value);
            return cellDate >= monthsAgo;
          }
          if (unit === 'years') {
            const yearsAgo = new Date(now);
            yearsAgo.setFullYear(yearsAgo.getFullYear() - value);
            return cellDate >= yearsAgo;
          }
          break;
      }
    }

    // Standard comparison operators
    return this.compareValues(cellValue, value, operator, type);
  }

  private compareValues(cellValue: any, filterValue: any, operator: FilterOperator, type?: string): boolean {
    if (type === 'number') {
      const numCell = parseFloat(String(cellValue).replace(',', '.'));
      const numFilter = parseFloat(String(filterValue).replace(',', '.'));
      
      if (isNaN(numCell) || isNaN(numFilter)) return false;

      switch (operator) {
        case '=': case 'equals': return numCell === numFilter;
        case '<>': case 'notequal': return numCell !== numFilter;
        case '<': return numCell < numFilter;
        case '>': return numCell > numFilter;
        case '<=': return numCell <= numFilter;
        case '>=': return numCell >= numFilter;
      }
    }

    if (type === 'date' || type === 'datetime') {
      const dateCell = new Date(cellValue);
      const dateFilter = new Date(filterValue);

      switch (operator) {
        case '=': case 'equals': return dateCell.getTime() === dateFilter.getTime();
        case '<>': case 'notequal': return dateCell.getTime() !== dateFilter.getTime();
        case '<': return dateCell < dateFilter;
        case '>': return dateCell > dateFilter;
        case '<=': return dateCell <= dateFilter;
        case '>=': return dateCell >= dateFilter;
      }
    }

    if (type === 'boolean') {
      const boolCell = cellValue === true || cellValue === 'true';
      const boolFilter = filterValue === true || filterValue === 'true';

      switch (operator) {
        case '=': case 'equals': return boolCell === boolFilter;
        case '<>': case 'notequal': return boolCell !== boolFilter;
      }
    }

    // String comparison
    switch (operator) {
      case '=': case 'equals': return String(cellValue) === String(filterValue);
      case '<>': case 'notequal': return String(cellValue) !== String(filterValue);
    }

    return false;
  }


  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  }
}