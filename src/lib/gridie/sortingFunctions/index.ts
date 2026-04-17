// src/gridie/sortingFunctions/index.ts

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  columnIndex: number;
  direction: SortDirection;
  order: number;  // Orden de aplicación del sort (1, 2, 3...)
}

export class SortingManager {
  private sortStates: SortState[] = [];

  // Agregar o actualizar sort en una columna
  addSort(columnIndex: number, direction: SortDirection): void {
    const existingIndex = this.sortStates.findIndex(s => s.columnIndex === columnIndex);
    
    if (direction === null) {
      // Remover sort
      if (existingIndex !== -1) {
        this.sortStates.splice(existingIndex, 1);
        this.reorderSorts();
      }
    } else if (existingIndex !== -1) {
      // Actualizar dirección existente
      this.sortStates[existingIndex].direction = direction;
    } else {
      // Agregar nuevo sort
      this.sortStates.push({
        columnIndex,
        direction,
        order: this.sortStates.length + 1
      });
    }
  }

  // Limpiar todos los sorts
  clearAll(): void {
    this.sortStates = [];
  }

  // Limpiar sort de una columna específica
  clearColumn(columnIndex: number): void {
    const index = this.sortStates.findIndex(s => s.columnIndex === columnIndex);
    if (index !== -1) {
      this.sortStates.splice(index, 1);
      this.reorderSorts();
    }
  }

  // Obtener estado de sort de una columna
  getColumnSort(columnIndex: number): SortState | null {
    return this.sortStates.find(s => s.columnIndex === columnIndex) || null;
  }

  // Obtener todos los estados de sort
  getAllSorts(): SortState[] {
    return [...this.sortStates];
  }

  // Reordenar los números de orden
  private reorderSorts(): void {
    this.sortStates.forEach((sort, index) => {
      sort.order = index + 1;
    });
  }

  // Aplicar todos los sorts a los datos
  applySorts(data: any[], headers: any[]): any[] {
    if (this.sortStates.length === 0) return data;

    const sortedData = [...data];
    
    sortedData.sort((a, b) => {
      for (const sortState of this.sortStates) {
        const aValue = this.getCellValueByPosition(a, sortState.columnIndex);
        const bValue = this.getCellValueByPosition(b, sortState.columnIndex);
        
        const comparison = this.compareValues(aValue, bValue, headers[sortState.columnIndex]?.type);
        
        if (comparison !== 0) {
          return sortState.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    return sortedData;
  }

  private getCellValueByPosition(row: any, position: number): any {
    if (Array.isArray(row)) {
      return row[position];
    }
    const values = Object.values(row);
    return values[position];
  }

  private compareValues(a: any, b: any, type?: string): number {
    // Manejar valores null/undefined
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    // Comparación según tipo
    switch (type) {
      case 'number':
        return Number(a) - Number(b);
      
      case 'date':
        return new Date(a).getTime() - new Date(b).getTime();
      
      case 'boolean':
        return (a === b) ? 0 : a ? -1 : 1;
      
      default:
        // String comparison
        const aStr = String(a).toLowerCase();
        const bStr = String(b).toLowerCase();
        return aStr.localeCompare(bStr);
    }
  }
}