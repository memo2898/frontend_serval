// @ts-nocheck
// src/gridie/gridie.ts nuevo
//Ultimos cambios de gridie donde faltan ajustar
import { SortingManager } from "./sortingFunctions";
import type { SortDirection } from "./sortingFunctions";
import { FilteringManager } from "./filteringFunctions";
import type { FilterOperator, FilterState } from "./filteringFunctions";
import { getLanguage } from "./lang";
import type { Language, LanguageStrings } from "./lang";

import {
  gridieStyles,
  //contextMenuStyles,
  filterRowStyles,
  //headerFilterStyles,
  paginationStyles
} from "./styles";

import { getFilterIcon } from "./assets/icons/filters";

export interface GridieFilterRowConfig {
  visible: boolean;
  operators?: readonly FilterOperator[] | FilterOperator[];
}

export interface GridieHeaderConfig {
  label?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: "string" | "number" | "date" | "boolean";
  filters?: GridieFiltersConfig;
  timeFormat?: "12h" | "24h";
}

export interface GridieCellAction {
  content: string;
  event: string;
  funct: (rowData: any, rowIndex: number) => void;
}

export interface GridieConfig {
  id: string;
  headers: (string | GridieHeaderConfig)[];
  body: any[];
  mode?: GridieMode;
  enableSort?: boolean;
  enableFilter?: boolean;
  language?: Language;
  paging?: GridiePagingConfig;
  loading?: boolean;
  loadingText?: string;
  
  //  Campo identificador único
  identityField?: string;
}




export interface HeaderFilterParameter {
  text: string;
  operator: FilterOperator;
  value: any;
  value2?: any;
  unit?: "days" | "months" | "years";
  year?: number;
}

export interface GridieHeaderFilterConfig {
  visible: boolean;
  values?: any[];
  parameters?: HeaderFilterParameter[];
  showCount?: boolean;
  search?: boolean;
  dateHierarchy?: ("year" | "month" | "day" | "hour")[];
  timeFormat?: "12h" | "24h";
  locale?: "es" | "en";
}

// Actualizar GridieFiltersConfig
export interface GridieFiltersConfig {
  filterRow?: GridieFilterRowConfig;
  headerFilter?: GridieHeaderFilterConfig;
}


//INTERFACES DE PAGINACION START
// ============= INTERFACES DE PAGINACIÓN =============

export interface GridiePageSizeConfig {
  visible?: boolean;  // Default: true
  default?: number;   // Default: 10
  options?: number[]; // Default: [10, 25, 50, 100]
}

export interface GridieJumpToConfig {
  visible?: boolean;     // Default: false
  position?: "inline" | "below"; // Default: "inline"
  buttonText?: string;   // Default: "→"
}

export interface GridieNavigationConfig {
  visible?: boolean;       // Default: true
  showPrevNext?: boolean;  // Default: true
  showFirstLast?: boolean; // Default: true
  maxButtons?: number;     // Default: 5
  jumpTo?: GridieJumpToConfig;
}

export interface GridiePagingConfig {
  enabled: boolean;
  pageSize?: GridiePageSizeConfig;
  showInfo?: boolean;      // Default: true
  navigation?: GridieNavigationConfig;
  position?: "bottom" | "top" | "both"; // Default: "bottom"
}

export type GridieMode = "client" | "server" | "infinite-scroll";
//INTERFACES DE PAGINACION END


export class Gridie extends HTMLElement {
  private shadow: ShadowRoot;
  private _id: string = "";
  private _headers: (string | GridieHeaderConfig)[] = [];
  private _body: any[] = [];
  private _originalBody: any[] = [];
  private _filteredBody: any[] = [];
  private _config: Partial<GridieConfig> = {};
  private _eventHandlers: Map<string, GridieCellAction> = new Map();
  private _sortingManager: SortingManager = new SortingManager();
  private _filteringManager: FilteringManager = new FilteringManager();
  private _language: Language = "es";
private _lang: LanguageStrings = getLanguage("es");
  private _contextMenu: HTMLDivElement | null = null;
  private _globalStyleId = "gridie-global-styles";
  private _activeOperatorDropdown: number | null = null;
  private _selectedOperators: Map<number, FilterOperator> = new Map();
  private _operatorDropdownMenu: HTMLDivElement | null = null;
  private _activeHeaderFilterDropdown: number | null = null;
  private _headerFilterMenu: HTMLDivElement | null = null;
  private _headerFilterSearchValues: Map<number, string> = new Map();
  private _headerFilterSelections: Map<number, Set<any>> = new Map();
  private _headerFilterExpandedState: Map<string, boolean> = new Map();
  private _currentPage: number = 1;
  private _pageSize: number = 10;
  private _totalItems: number = 0;
  private _totalPages: number = 0;
  private _pagedBody: any[] = [];
  private _hasError: boolean = false;
  private _errorMessage: string = "";
  private _loading: boolean = false;


  private _identityField?: string;
  private _identityMap: Map<any, any> = new Map();
  private _lastScrollLeft: number = 0;

constructor(config?: GridieConfig) {
  super();
  this.shadow = this.attachShadow({ mode: "open" });
  
  try {
    if (config?.language) {
      this._language = config.language;
    }
    
    this._lang = getLanguage(this._language);
    this.injectGlobalStyles();

    if (config) {
      this.validateConfig(config);
      this._id = config.id;
      this._headers = config.headers;
      this._body = config.body;
      this._originalBody = [...config.body];
      this._filteredBody = [...config.body];
      
      // ✅ CAMBIO: Si no se especifica identityField, usar "identityField" por defecto
      this._identityField = config.identityField || 'identityField';
      
      this._config = {
        mode: config.mode || "client",
        enableSort: config.enableSort ?? true,
        enableFilter: config.enableFilter ?? false,
        language: this._language,
        paging: config.paging ? {
          ...config.paging,
          position: config.paging.position || 'bottom'
        } : undefined,
        loading: config.loading,
        loadingText: config.loadingText,
        identityField: this._identityField,
      };
      
      if (this._config.paging?.enabled) {
        this._pageSize = this._config.paging.pageSize?.default || 10;
        this._totalItems = this._originalBody.length;
        this._totalPages = Math.ceil(this._totalItems / this._pageSize) || 1;
        this.updatePagination();
      }
      
      // ✅ CAMBIO: SIEMPRE construir el identity map
      this.buildIdentityMap();
    }
  } catch (error) {
    this._hasError = true;
    this._errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ Error inicializando Gridie:", error);
  }
}

  static get observedAttributes() {
    return ["id", "headers", "body", "config", "language"];
  }




  // ========== MÉTODOS PÚBLICOS DE DATOS ==========

/**
 * Obtiene el body actual (después de filtros y sorting)
 * @returns Array con los datos actuales filtrados
 * @public
 */
public getBody(): any[] {
  return [...this._body];
}

/**
 * Obtiene el body original (sin filtros ni sorting)
 * @returns Array con los datos originales
 * @public
 */
public getOriginalBody(): any[] {
  return [...this._originalBody];
}

/**
 * Obtiene los datos de la página actual (si paginación está activa)
 * @returns Array con los datos de la página visible
 * @public
 */
public getPagedBody(): any[] {
  return [...this._pagedBody];
}

/**
 * Actualiza solo los headers manteniendo data
 * @param headers - Nuevos headers
 * @public
 */
public setHeaders(headers: (string | GridieHeaderConfig)[]): void {
  if (!Array.isArray(headers) || headers.length === 0) {
    throw new Error("Gridie.setHeaders: headers debe ser un array no vacío");
  }
  
  this._headers = headers;
  
  // Limpiar filtros porque las columnas cambiaron
  this._sortingManager.clearAll();
  this._filteringManager.clearAll();
  this._selectedOperators.clear();
  this._headerFilterSearchValues.clear();
  this._headerFilterSelections.clear();
  this._headerFilterExpandedState.clear();
  
  this.render();
  
 // console.log(`📊 Headers actualizados: ${headers.length} columnas`);
}


/**
 * Re-renderiza la tabla sin cambiar datos ni estado
 * Útil para actualizar después de cambios externos
 * @public
 */
public refresh(): void {
  this.render();
  //console.log("🔄 Tabla refrescada");
}

/**
 * Re-aplica filtros y sorting sin cambiar datos originales
 * Útil si modificaste datos individuales con updateRow
 * @public
 */
public reapply(): void {
  this.applyFiltersAndSorting();
 // console.log("🔄 Filtros y sorting re-aplicados");
}
  /**
 * Valida la configuración antes de inicializar
 * @private
 */
private validateConfig(config: GridieConfig): void {
  if (!config.id) {
    throw new Error("Gridie: El campo 'id' es requerido");
  }

  if (!config.headers || config.headers.length === 0) {
    throw new Error("Gridie: El campo 'headers' es requerido y no puede estar vacío");
  }

  if (!Array.isArray(config.body)) {
    throw new Error("Gridie: El campo 'body' debe ser un array");
  }

  // Validar paginación
  if (config.paging?.enabled) {
    const pageSize = config.paging.pageSize?.default;
    if (pageSize && pageSize < 1) {
      throw new Error("Gridie: pageSize debe ser mayor a 0");
    }
  }
  
  // ✅ MEJORADO: Validar identityField
  if (config.identityField && config.body.length > 0) {
    const firstRow = config.body[0];
    if (typeof firstRow === 'object' && firstRow !== null && !Array.isArray(firstRow)) {
      if (!(config.identityField in firstRow)) {
        console.warn(
          ` Gridie: El identityField "${config.identityField}" no existe en las filas del body.`,
          `\nCampos disponibles:`, Object.keys(firstRow),
          `\nAsegúrate de que todas las filas tengan este campo.`
        );
      }
      
      // ✅ NUEVO: Advertencia si identityField está en headers
      const headerLabels = config.headers.map(h => 
        typeof h === 'string' ? h : h.label
      );
      
      if (headerLabels.includes(config.identityField)) {
        console.warn(
          `💡 TIP: El identityField "${config.identityField}" está en los headers.`,
          `\nPuedes omitirlo de los headers para ocultarlo de la tabla.`
        );
      }
    }
  }
}


/**
 * Muestra información de debug sobre el identityField
 * @public
 */
public debugIdentityField(): void {
  if (!this._identityField) {
    console.log("❌ No hay identityField configurado");
    return;
  }
  
  //console.log("🔍 Debug de identityField:");
  //console.log("  Campo:", this._identityField);
  //console.log("  Registros únicos:", this._identityMap.size);
  //console.log("  Total registros:", this._originalBody.length);
  
  if (this._originalBody.length > 0) {
    const firstRow = this._originalBody[0];
    const visibleKeys = this.getVisibleBodyKeys(firstRow);
    
    //console.log("  Keys totales:", Object.keys(firstRow));
    //console.log("  Keys visibles:", visibleKeys);
    //console.log("  Headers:", this._headers.map(h => typeof h === 'string' ? h : h.label));
  }
  
  // Detectar duplicados
  const values = this._originalBody.map(row => row[this._identityField!]);
  const duplicates = values.filter((val, index) => values.indexOf(val) !== index);
  
  if (duplicates.length > 0) {
    console.warn("   Valores duplicados encontrados:", [...new Set(duplicates)]);
  } else {
    //console.log("  ✅ No hay valores duplicados");
  }
}
/**
 * Limpia todos los filtros (Filter Row + Header Filters)
 * @public
 */
public clearAllFilters(): void {
  // Limpiar Filter Row
  this._filteringManager.clearAll();
  
  // Limpiar Header Filters
  this._headerFilterSelections.clear();
  this._headerFilterSearchValues.clear();
  
  // Limpiar operadores seleccionados
  this._selectedOperators.clear();
  
  // Resetear a página 1
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
  }
  
  // Re-aplicar (sin filtros)
  this.applyFiltersAndSorting();
  
  //console.log("🗑️ Todos los filtros limpiados");
}


/**
 * Establece el estado de carga de la tabla
 * @param loading - true para mostrar loading, false para ocultar
 * @public
 */
public setLoading(loading: boolean): void {
  this._loading = loading;
  
  if (loading) {
    this.showLoadingOverlay();
  } else {
    this.hideLoadingOverlay();
  }
}

/**
 * Muestra el overlay de loading
 * @private
 */
private showLoadingOverlay(): void {
  const container = this.shadow.querySelector('.gridie-container') as HTMLElement;
  if (!container) return;

  // Si ya existe, no crear otro
  if (container.querySelector('.gridie-loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'gridie-loading-overlay';
  overlay.innerHTML = `
    <div class="gridie-loading-content">
      <div class="gridie-spinner"></div>
      <span class="gridie-loading-text">${this._config.loadingText || this._lang.table.loading || 'Cargando...'}</span>
    </div>
  `;
  
  container.style.position = 'relative';
  container.appendChild(overlay);
}


/**
 * Renderiza el estado de error
 * @private
 */
private renderErrorState(): void {
  this.shadow.innerHTML = `
    <style>
      .gridie-error-container {
        padding: 40px 20px;
        text-align: center;
        border: 2px dashed #e74c3c;
        border-radius: 8px;
        background: #fff5f5;
        font-family: Arial, sans-serif;
      }
      
      .gridie-error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .gridie-error-title {
        font-size: 20px;
        font-weight: 600;
        color: #e74c3c;
        margin: 0 0 8px 0;
      }
      
      .gridie-error-message {
        font-size: 14px;
        color: #666;
        margin: 0 0 20px 0;
      }
      
      .gridie-error-btn {
        padding: 10px 20px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      
      .gridie-error-btn:hover {
        background: #c0392b;
      }
    </style>
    
    <div class="gridie-error-container">
      <div class="gridie-error-icon"></div>
      <h3 class="gridie-error-title">Error al cargar la tabla</h3>
      <p class="gridie-error-message">${this._errorMessage}</p>
      <button class="gridie-error-btn" onclick="location.reload()">
        Recargar página
      </button>
    </div>
  `;
}
/**
 * Oculta el overlay de loading
 * @private
 */
private hideLoadingOverlay(): void {
  const overlay = this.shadow.querySelector('.gridie-loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}


  /**
 * Construye el map de identidades para búsquedas O(1)
 * @private
 */
/**
 * Construye el map de identidades para búsquedas O(1)
 * @private
 */
private buildIdentityMap(): void {
  // ✅ CAMBIO: Si no hay _identityField configurado, usar "identityField" por defecto
  const fieldName = this._identityField || 'identityField';
  
  this._identityMap.clear();
  
  this._originalBody.forEach((row, index) => {
    // Validar que sea un objeto
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      console.warn(` Gridie: La fila en índice ${index} no es un objeto. identityField solo funciona con objetos.`);
      return;
    }
    
    const identityValue = row[fieldName];
    
    // Validar que el campo exista
    if (identityValue === undefined || identityValue === null) {
      console.warn(` Gridie: La fila en índice ${index} no tiene el campo "${fieldName}".`);
      return;
    }
    
    // Detectar duplicados (warn + usar el primero)
    if (this._identityMap.has(identityValue)) {
      console.warn(` Gridie: Valor duplicado "${identityValue}" encontrado en campo "${fieldName}". Se usará la primera ocurrencia.`);
      return;
    }
    
    this._identityMap.set(identityValue, row);
  });
  
 // console.log(`🗂️ Identity map construido: ${this._identityMap.size} registros únicos (campo: "${fieldName}")`);
}

/**
 * Obtiene las keys del body que DEBEN renderizarse (excluye identityField)
 * @private
 */
/**
 * Obtiene las keys del body que DEBEN renderizarse (excluye identityField)
 * @private
 */
private getVisibleBodyKeys(row: any): string[] {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return [];
  }
  
  const allKeys = Object.keys(row);
  
  // ✅ CAMBIO: Excluir SIEMPRE el campo llamado "identityField"
  // Ya no importa el valor de this._identityField
  return allKeys.filter(key => key !== 'identityField');
}

/**
 * Obtiene el valor de una celda excluyendo identityField
 * @private
 */
private getCellValueByPositionFiltered(row: any, position: number): any {
  const visibleKeys = this.getVisibleBodyKeys(row);
  
  if (position < 0 || position >= visibleKeys.length) {
    return undefined;
  }
  
  return row[visibleKeys[position]];
}
// ========== MÉTODOS PÚBLICOS DE IDENTITY ==========

/**
 * Obtiene una fila por su valor de identidad
 * @param value - Valor del campo identityField a buscar
 * @returns La fila encontrada o undefined
 * @example
 * const user = gridie.getRowByIdentity('u1');
 */
public getRowByIdentity(value: any): any | undefined {
  if (!this._identityField) {
    console.error('❌ Gridie.getRowByIdentity: identityField no está configurado');
    return undefined;
  }
  
  const row = this._identityMap.get(value);
  
  if (!row) {
    console.warn(` Gridie.getRowByIdentity: No se encontró fila con ${this._identityField} = "${value}"`);
  }
  
  return row;
}

/**
 * Verifica si existe una fila con el valor de identidad
 * @param value - Valor del campo identityField a buscar
 * @returns true si existe, false si no
 * @example
 * if (gridie.hasRowByIdentity('u1')) { ... }
 */
public hasRowByIdentity(value: any): boolean {
  if (!this._identityField) {
    console.error('❌ Gridie.hasRowByIdentity: identityField no está configurado');
    return false;
  }
  
  return this._identityMap.has(value);
}

/**
 * Actualiza una fila por su valor de identidad
 * @param value - Valor del campo identityField a buscar
 * @param data - Datos parciales o completos para actualizar
 * @returns true si se actualizó, false si no se encontró
 * @example
 * gridie.updateRowByIdentity('u1', { edad: 26 });
 */
public updateRowByIdentity(value: any, data: Partial<any>): boolean {
  if (!this._identityField) {
    console.error('❌ Gridie.updateRowByIdentity: identityField no está configurado');
    return false;
  }
  
  const row = this._identityMap.get(value);
  
  if (!row) {
    console.warn(` Gridie.updateRowByIdentity: No se encontró fila con ${this._identityField} = "${value}"`);
    return false;
  }
  
  // Buscar índice en _originalBody
  const index = this._originalBody.indexOf(row);
  
  if (index === -1) {
    console.error('❌ Gridie.updateRowByIdentity: Inconsistencia interna - fila en map pero no en body');
    return false;
  }
  
  // Actualizar la fila (merge de datos)
  this._originalBody[index] = {
    ...this._originalBody[index],
    ...data
  };
  
  // Reconstruir map (por si cambió el identity value)
  this.buildIdentityMap();
  
  // Re-aplicar filtros y sorting
  this.applyFiltersAndSorting();
  
  //console.log(`✅ Gridie.updateRowByIdentity: Fila actualizada (${this._identityField} = "${value}")`);
  return true;
}

/**
 * Elimina una fila por su valor de identidad
 * @param value - Valor del campo identityField a buscar
 * @returns true si se eliminó, false si no se encontró
 * @example
 * gridie.removeRowByIdentity('u1');
 */
public removeRowByIdentity(value: any): boolean {
  if (!this._identityField) {
    console.error('❌ Gridie.removeRowByIdentity: identityField no está configurado');
    return false;
  }
  
  const row = this._identityMap.get(value);
  
  if (!row) {
    console.warn(` Gridie.removeRowByIdentity: No se encontró fila con ${this._identityField} = "${value}"`);
    return false;
  }
  
  // Buscar índice en _originalBody
  const index = this._originalBody.indexOf(row);
  
  if (index === -1) {
    console.error(' Gridie.removeRowByIdentity: Inconsistencia interna - fila en map pero no en body');
    return false;
  }
  
  // Eliminar de _originalBody
  this._originalBody.splice(index, 1);
  
  // Reconstruir map
  this.buildIdentityMap();
  
  // Re-aplicar filtros y sorting
  this.applyFiltersAndSorting();
  
  //console.log(`🗑️ Gridie.removeRowByIdentity: Fila eliminada (${this._identityField} = "${value}")`);
  return true;
}



connectedCallback() {
  this.render();
  document.addEventListener("click", this.handleDocumentClick.bind(this));
  
  // Esperar a que el DOM esté completamente renderizado
  setTimeout(() => {
    // Buscar TODOS los elementos posibles con scroll
    const container = this.shadow.querySelector('.gridie-container') as HTMLElement;
    const wrapper = this.shadow.querySelector('.gridie-table-wrapper') as HTMLElement;
    const table = this.shadow.querySelector('.gridie-table') as HTMLElement;
    
    // Encontrar el que REALMENTE tiene scroll horizontal
    const scrollElement = [wrapper, container, table].find(el => 
      el && el.scrollWidth > el.clientWidth
    );
    
    if (!scrollElement) {
      console.warn(' No se encontró elemento con scroll horizontal');
      return;
    }
    
    //console.log('🎯 Elemento con scroll encontrado:', scrollElement.className || scrollElement.tagName);
    //console.log('   scrollWidth:', scrollElement.scrollWidth);
    //console.log('   clientWidth:', scrollElement.clientWidth);
    
    // Inicializar tracking
    this._lastScrollLeft = scrollElement.scrollLeft;
    
    const handleScroll = () => {
      const currentScrollLeft = scrollElement.scrollLeft;
      
      // console.log('📊 Scroll event:', {
      //   elemento: scrollElement.className || scrollElement.tagName,
      //   ultimo: this._lastScrollLeft,
      //   actual: currentScrollLeft,
      //   cambio: Math.abs(currentScrollLeft - this._lastScrollLeft)
      // });
      
      // Detectar cambio en scroll horizontal
      if (Math.abs(this._lastScrollLeft - currentScrollLeft) > 0) {
       // console.log('🔄 CERRANDO MENÚS - Scroll horizontal detectado');
        
        this.hideContextMenu();
        this.closeHeaderFilterDropdown();
        this.closeOperatorDropdown();
      }
      
      // Actualizar posición
      this._lastScrollLeft = currentScrollLeft;
    };
    
    scrollElement.addEventListener('scroll', handleScroll);
    
    // Guardar referencias para cleanup
    (this as any)._scrollHandler = handleScroll;
    (this as any)._scrollElement = scrollElement;
    
    //console.log('✅ Listener de scroll adjuntado correctamente');
  }, 100); // ← Pequeño delay para asegurar que el DOM esté listo
}

// disconnectedCallback() {
//   document.removeEventListener("click", this.handleDocumentClick.bind(this));
  
//   // ✅ Remover listener de scroll
//   const container = this.shadow.querySelector('.gridie-container') as HTMLElement;
//   if (container && (this as any)._scrollHandler) {
//     container.removeEventListener('scroll', (this as any)._scrollHandler);
//     delete (this as any)._scrollHandler;
//   }
  
//   // Limpiar menús
//   this.hideContextMenu();
//   this.closeOperatorDropdown();
//   this.closeHeaderFilterDropdown();
// }

disconnectedCallback() {
  document.removeEventListener("click", this.handleDocumentClick.bind(this));
  
  // ✅ Remover listener de scroll
  const container = this.shadow.querySelector('.gridie-container') as HTMLElement;
  if (container && (this as any)._scrollHandler) {
    container.removeEventListener('scroll', (this as any)._scrollHandler);
    delete (this as any)._scrollHandler;
  }
  
  // Limpiar menús
  this.hideContextMenu();
  this.closeOperatorDropdown();
  this.closeHeaderFilterDropdown();
  
  // Resetear scroll tracking
  this._lastScrollLeft = 0;
}


  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === "language") {
        this._language = newValue as Language;
        this._lang = getLanguage(this._language);
      }
      this.render();
    }
  }

  private injectGlobalStyles(): void {
    if (document.getElementById(this._globalStyleId)) return;

    const style = document.createElement("style");
    style.id = this._globalStyleId;
    //  Ya no necesitamos contextMenuStyles aquí
    style.textContent = "";

    // Si el string está vacío, podemos omitir la inyección
    if (style.textContent.trim()) {
      document.head.appendChild(style);
    }
  }

public setConfig(config: GridieConfig) {
  this._id = config.id;
  this._headers = config.headers;
  this._body = config.body;
  this._originalBody = [...config.body];
  this._filteredBody = [...config.body];
  this._language = config.language || "es";
  this._lang = getLanguage(this._language);
  
  // ✅ NUEVO: Actualizar identityField
  this._identityField = config.identityField;
  
  this._config = {
    mode: config.mode || "client",
    enableSort: config.enableSort ?? true,
    enableFilter: config.enableFilter ?? false,
    language: this._language,
    paging: config.paging,
    identityField: config.identityField,
  };
  
  this._sortingManager.clearAll();
  this._filteringManager.clearAll();
  this._selectedOperators.clear();
  this._headerFilterSearchValues.clear();
  this._headerFilterSelections.clear();
  this._headerFilterExpandedState.clear();
  
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
    this._pageSize = this._config.paging.pageSize?.default || 10;
    this._totalItems = this._originalBody.length;
    this._totalPages = Math.ceil(this._totalItems / this._pageSize) || 1;
    this.updatePagination();
  }
  
  // ✅ NUEVO: Reconstruir identity map
  if (this._identityField) {
    this.buildIdentityMap();
  }
  
  this.render();
}





public destroy(): void {
  try {
    document.removeEventListener("click", this.handleDocumentClick.bind(this));
    
    this.hideContextMenu();
    this.closeOperatorDropdown();
    this.closeHeaderFilterDropdown();
    
    this._eventHandlers.clear();
    this._selectedOperators.clear();
    this._headerFilterSearchValues.clear();
    this._headerFilterSelections.clear();
    this._headerFilterExpandedState.clear();
    
    // ✅ NUEVO: Limpiar identity map
    this._identityMap.clear();
    
    this._sortingManager.clearAll();
    this._filteringManager.clearAll();
    
    this.remove();
    
    // console.log("🗑️ Gridie destruido correctamente");
  } catch (error) {
    console.error("Error al destruir Gridie:", error);
  }
}

public setBody(data: any[]): void {
  if (!Array.isArray(data)) {
    throw new Error("Gridie.setBody: data debe ser un array");
  }
  
  this._body = data;
  this._originalBody = [...data];
  this._filteredBody = [...data];
  
  this._sortingManager.clearAll();
  this._filteringManager.clearAll();
  this._selectedOperators.clear();
  this._headerFilterSearchValues.clear();
  this._headerFilterSelections.clear();
  this._headerFilterExpandedState.clear();
  
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
    this._totalItems = this._originalBody.length;
    this._totalPages = Math.ceil(this._totalItems / this._pageSize) || 1;
    this.updatePagination();
  }
  
  // ✅ NUEVO: Reconstruir identity map
  if (this._identityField) {
    this.buildIdentityMap();
  }
  
  this.render();
  
  // console.log(`📊 Body actualizado: ${data.length} items`);
}


public setData(config: { headers: (string | GridieHeaderConfig)[]; data: any[] }) {
  this._headers = config.headers;
  this._body = config.data;
  this._originalBody = [...config.data];
  this._filteredBody = [...config.data];
  
  this._sortingManager.clearAll();
  this._filteringManager.clearAll();
  this._selectedOperators.clear();
  this._headerFilterSearchValues.clear();
  this._headerFilterSelections.clear();
  this._headerFilterExpandedState.clear();
  
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
    this._totalItems = this._originalBody.length;
    this._totalPages = Math.ceil(this._totalItems / this._pageSize) || 1;
    this.updatePagination();
  }
  
  // ✅ NUEVO: Reconstruir identity map
  if (this._identityField) {
    this.buildIdentityMap();
  }
  
  this.render();
}

/**
 * Agrega una nueva fila a la tabla
 * @param row - Fila a agregar
 * @returns true si se agregó exitosamente, false si fue rechazada
 */
public addRow(row: any): boolean {
  // ✅ VALIDACIÓN: Si hay identityField configurado, validar unicidad
  if (this._identityField) {
    // Validar que sea un objeto
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      console.error('❌ Gridie.addRow: La fila debe ser un objeto cuando identityField está configurado');
      return false;
    }
    
    const identityValue = row[this._identityField];
    
    // Validar que tenga el campo requerido
    if (identityValue === undefined || identityValue === null) {
      console.error(`❌ Gridie.addRow: La fila no tiene el campo "${this._identityField}" requerido`);
      return false;
    }
    
    //  Verificar duplicados
    if (this._identityMap.has(identityValue)) {
      console.error(`❌ Gridie.addRow: Ya existe una fila con ${this._identityField} = "${identityValue}". Operación rechazada.`);
      return false;
    }
  }
  
  // Agregar a _originalBody
  this._originalBody.push(row);
  
  // Reconstruir map si está configurado
  if (this._identityField) {
    this.buildIdentityMap();
  }
  
  // Re-aplicar filtros y sorting
  this.applyFiltersAndSorting();
  
  // console.log(`✅ Gridie.addRow: Fila agregada exitosamente`);
  return true;
}



  removeRow(index: number) {
    const originalIndex = this._originalBody.findIndex(
      (r) => r === this._body[index]
    );
    if (originalIndex !== -1) {
      this._originalBody.splice(originalIndex, 1);
    }
    this.applyFiltersAndSorting();
  }

  updateRow(index: number, row: any) {
    if (index >= 0 && index < this._body.length) {
      const originalIndex = this._originalBody.findIndex(
        (r) => r === this._body[index]
      );
      if (originalIndex !== -1) {
        this._originalBody[originalIndex] = {
          ...this._originalBody[originalIndex],
          ...row,
        };
      }
      this.applyFiltersAndSorting();
    }
  }


  
  get gridieId(): string {
    if (this._id) return this._id;
    const idAttr = this.getAttribute("id");
    return idAttr || "";
  }

  get headers(): GridieHeaderConfig[] {
    const headers =
      this._headers.length > 0 ? this._headers : this.getAttributeHeaders();

    return headers.map((header, index) => this.normalizeHeader(header, index));
  }

get body(): any[] {
  // ✅ CAMBIO: Siempre retornar _body (sin paginación aquí)
  // La paginación se aplica en updatePagination() -> _pagedBody
  return this._body.length > 0 ? this._body : [];
}

  private getCurrentOperator(columnIndex: number): FilterOperator {
    const header = this.headers[columnIndex];

    // Primero intentar obtenerlo del filtro activo
    const currentFilter = this._filteringManager.getColumnFilter(columnIndex);
    if (currentFilter) {
      return currentFilter.operator;
    }

    // Si no hay filtro activo, buscar en los operadores seleccionados
    const selectedOperator = this._selectedOperators.get(columnIndex);
    if (selectedOperator) {
      return selectedOperator;
    }

    // Si no hay nada, usar el primer operador por defecto
    return this.getOperatorsForColumn(header)[0];
  }
  private getAttributeHeaders(): (string | GridieHeaderConfig)[] {
    try {
      const headersAttr = this.getAttribute("headers");
      return headersAttr ? JSON.parse(headersAttr) : [];
    } catch {
      return [];
    }
  }

  // private normalizeHeader(
  //   header: string | GridieHeaderConfig,
  //   position: number
  // ): GridieHeaderConfig {
  //   if (typeof header === "string") {
  //     return {
  //       label: header,
  //       sortable: this._config.enableSort ?? true,
  //       filterable: false,
  //       type: "string",
  //     };
  //   }
  //   return {
  //     label: header.label || `Column ${position + 1}`,
  //     sortable: header.sortable ?? this._config.enableSort ?? true,
  //     filterable: header.filterable ?? false,
  //     type: header.type || "string",
  //     width: header.width,
  //     filters: header.filters,
  //   };
  // }

private normalizeHeader(
  header: string | GridieHeaderConfig,
  position: number
): GridieHeaderConfig {
  // ✅ CASO 1: Header como string simple
  if (typeof header === "string") {
    return {
      label: header,
      sortable: this._config.enableSort ?? true,
      filterable: false,
      type: "string",
      filters: this._config.enableFilter ? {
        filterRow: {
          visible: false,
          operators: this.getDefaultOperators("string")
        }
      } : undefined
    };
  }

  // ✅ CASO 2: Header como objeto GridieHeaderConfig
  
  // ✅ CRÍTICO: Solo normalizar filters SI EXISTEN
  let normalizedFilters: GridieFiltersConfig | undefined = undefined;
  
  if (header.filters) {
    normalizedFilters = {};
    
    // Normalizar filterRow si existe
    if (header.filters.filterRow) {
      normalizedFilters.filterRow = {
        visible: header.filters.filterRow.visible ?? false,
        operators: (Array.isArray(header.filters.filterRow.operators) && header.filters.filterRow.operators.length > 0)
          ? [...header.filters.filterRow.operators]
          : this.getDefaultOperators(header.type || "string")
      };
    }
    
    // Normalizar headerFilter si existe
    if (header.filters.headerFilter) {
      normalizedFilters.headerFilter = {
        visible: header.filters.headerFilter.visible ?? false,
        values: header.filters.headerFilter.values,
        parameters: header.filters.headerFilter.parameters,
        showCount: header.filters.headerFilter.showCount,
        search: header.filters.headerFilter.search,
        dateHierarchy: header.filters.headerFilter.dateHierarchy,
        timeFormat: header.filters.headerFilter.timeFormat,
        locale: header.filters.headerFilter.locale
      };
    }
  }

  // ✅ RETORNAR con la estructura correcta
  return {
    label: header.label || `Column ${position + 1}`,
    sortable: header.sortable ?? this._config.enableSort ?? true,
    filterable: header.filterable ?? false,
    type: header.type || "string",
    width: header.width,
    filters: normalizedFilters,  // ← AQUÍ está la clave
    timeFormat: header.timeFormat
  };
}
 private getCellValueByPosition(row: any, position: number): any {
  if (Array.isArray(row)) {
    return row[position];
  }
  
  // ✅ CAMBIO: Obtener solo valores visibles
  const visibleKeys = this.getVisibleBodyKeys(row);
  
  if (position < 0 || position >= visibleKeys.length) {
    return undefined;
  }
  
  return row[visibleKeys[position]];
}


  private formatCellValue(value: any, header: GridieHeaderConfig): string {
    if (value === null || value === undefined) return "";

    switch (header.type) {
      case "boolean":
        return value
          ? this._lang.filtering.booleanOptions.true
          : this._lang.filtering.booleanOptions.false;

      case "date":
        const str = String(value);

        //  CORRECCIÓN: Si tiene hora, mostrar con el formato especificado
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            //  Usar timeFormat de la columna, por defecto 24h
            const timeFormat = header.timeFormat || "24h";

            //  Formateo manual para control total
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const day = String(date.getUTCDate()).padStart(2, "0");
            const hours = date.getUTCHours();
            const minutes = String(date.getUTCMinutes()).padStart(2, "0");

            let timeStr: string;

            if (timeFormat === "12h") {
              const ampm = hours >= 12 ? "PM" : "AM";
              const hour12 = hours % 12 || 12;
              timeStr = `${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`;
            } else {
              timeStr = `${String(hours).padStart(2, "0")}:${minutes}`;
            }

            // Formato de fecha según idioma
            const dateStr =
              this._language === "es"
                ? `${day}/${month}/${year}`
                : `${month}/${day}/${year}`;

            return `${dateStr} ${timeStr}`;
          }
        }

        // Para strings YYYY-MM-DD (solo fecha, sin hora)
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          const [year, month, day] = str.split("-");
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          return date.toLocaleDateString(
            this._language === "es" ? "es-ES" : "en-US"
          );
        }

        // Para otros formatos
        return new Date(value).toLocaleDateString(
          this._language === "es" ? "es-ES" : "en-US"
        );

      case "number":
        return typeof value === "number"
          ? value.toLocaleString()
          : String(value);
      default:
        return String(value);
    }
  }

 private isActionCell(cell: any): cell is GridieCellAction[] {
  return (
    Array.isArray(cell) &&
    cell.length > 0 &&
    cell.every(item => 
      item &&
      typeof item === 'object' &&
      'content' in item &&
      'event' in item &&
      'funct' in item
    )
  );
}

private renderCell(
  row: any,
  header: GridieHeaderConfig,
  position: number,
  rowIndex: number
): string {
  const cellValue = this.getCellValueByPositionFiltered(row, position);

  // ✅ CASO 1: Array de acciones (con eventos)
  if (this.isActionCell(cellValue)) {
    return cellValue
      .map((action, actionIndex) => {
        const actionId = `action-${rowIndex}-${position}-${actionIndex}`;
        
        // Extraer HTML del content
        let htmlContent: string;
        if (typeof action.content === 'string') {
          htmlContent = action.content;
        } else if (action.content && typeof action.content === 'object') {
          // Recuperación defensiva
          htmlContent = (action.content as any).html || 
                       (action.content as any).text || 
                       String(action.content);
          console.warn(' action.content debería ser string:', action.content);
        } else {
          htmlContent = String(action.content || '');
        }
        
        this._eventHandlers.set(actionId, action);
        return `<span data-action-id="${actionId}">${htmlContent}</span>`;
      })
      .join(" ");
  }

  // ✅ CASO 2: HTML directo (string que parece HTML)
  if (typeof cellValue === 'string' && this.looksLikeHTML(cellValue)) {
    return cellValue; // Renderizar HTML tal cual
  }

  // ✅ CASO 3: Valor normal (formatear según tipo)
  return this.formatCellValue(cellValue, header);
}


/**
 * Detecta si un string contiene HTML
 * @private
 */
private looksLikeHTML(value: string): boolean {
  // Detectar tags HTML comunes
  return /<[a-z][\s\S]*>/i.test(value);
}
// ============= MÉTODOS PÚBLICOS DE PAGINACIÓN =============

/**
 * Navega a una página específica
 */
public goToPage(page: number): void {
  if (!this._config.paging?.enabled) {
    console.warn("Paginación no está habilitada");
    return;
  }
  
  if (page < 1 || page > this._totalPages) {
    console.warn(`Página ${page} fuera de rango (1-${this._totalPages})`);
    return;
  }
  
  if (page === this._currentPage) return;
  
  this._currentPage = page;
  this.updatePagination();
  
  // ✅ NUEVO: Actualizar solo tabla y footer (no re-renderizar todo)
  this.renderTableBody();
  this.updatePaginationFooter();
  
  // Emitir evento
  this.dispatchEvent(new CustomEvent('pagechange', {
    detail: { 
      page: this._currentPage,
      pageSize: this._pageSize,
      totalPages: this._totalPages,
      totalItems: this._totalItems
    }
  }));
  
  // console.log(`📄 Navegado a página ${page}`);
}
/**
 * Navega a la página siguiente
 */
public nextPage(): void {
  if (this._currentPage < this._totalPages) {
    this.goToPage(this._currentPage + 1);
  }
}

/**
 * Navega a la página anterior
 */
public previousPage(): void {
  if (this._currentPage > 1) {
    this.goToPage(this._currentPage - 1);
  }
}

/**
 * Navega a la primera página
 */
public firstPage(): void {
  this.goToPage(1);
}

/**
 * Navega a la última página
 */
public lastPage(): void {
  this.goToPage(this._totalPages);
}

/**
 * Cambia el tamaño de página
 */
public setPageSize(size: number): void {
  if (!this._config.paging?.enabled) {
    console.warn("Paginación no está habilitada");
    return;
  }
  
  if (size < 1) {
    console.warn("El tamaño de página debe ser mayor a 0");
    return;
  }
  
  if (size === this._pageSize) return;
  
  // Intentar mantener el primer item visible
  const firstVisibleIndex = (this._currentPage - 1) * this._pageSize;
  
  this._pageSize = size;
  this._currentPage = Math.floor(firstVisibleIndex / size) + 1;
  
  this.updatePagination();
  this.updateTableContent();
  
  // ✅ CRÍTICO: Actualizar footer después de cambiar pageSize
  this.updatePaginationFooter();
  
  // Emitir evento
  this.dispatchEvent(new CustomEvent('pagechange', {
    detail: { 
      page: this._currentPage,
      pageSize: this._pageSize,
      totalPages: this._totalPages,
      totalItems: this._totalItems
    }
  }));
  
 // console.log(`📊 Tamaño de página cambiado a ${size}`);
}


/**
 * Obtiene el tamaño de página actual
 */
public getPageSize(): number {
  return this._pageSize;
}

/**
 * Obtiene el número total de páginas
 */
public getTotalPages(): number {
  return this._totalPages;
}

/**
 * Obtiene la página actual
 */
public getCurrentPage(): number {
  return this._currentPage;
}

/**
 * Obtiene el total de items (después de filtros)
 */
public getTotalItems(): number {
  return this._totalItems;
}


/**
 * Calcula qué botones de página mostrar
 * Ejemplo: < 1 ... 3 4 [5] 6 7 ... 20 >
 */
private calculatePageButtons(): (number | "ellipsis")[] {
  const current = this._currentPage;
  const total = this._totalPages;
  const max = this._config.paging?.navigation?.maxButtons || 5;
  
  // Si hay pocas páginas, mostrar todas
  if (total <= max + 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const buttons: (number | "ellipsis")[] = [];
  
  // Siempre mostrar primera página
  buttons.push(1);
  
  // Calcular rango alrededor de página actual
  const halfMax = Math.floor(max / 2);
  let start = Math.max(2, current - halfMax);
  let end = Math.min(total - 1, current + halfMax);
  
  // Ajustar si estamos cerca del inicio o fin
  if (current <= halfMax + 1) {
    end = Math.min(max, total - 1);
  } else if (current >= total - halfMax) {
    start = Math.max(total - max + 1, 2);
  }
  
  // Ellipsis inicial
  if (start > 2) {
    buttons.push("ellipsis");
  }
  
  // Páginas del rango
  for (let i = start; i <= end; i++) {
    buttons.push(i);
  }
  
  // Ellipsis final
  if (end < total - 1) {
    buttons.push("ellipsis");
  }
  
  // Siempre mostrar última página
  if (total > 1) {
    buttons.push(total);
  }
  
  return buttons;
}



  private handleHeaderClick(columnIndex: number): void {
    const header = this.headers[columnIndex];
    if (!header.sortable) return;

    const currentSort = this._sortingManager.getColumnSort(columnIndex);
    let newDirection: SortDirection;

    if (!currentSort) {
      newDirection = "asc";
    } else if (currentSort.direction === "asc") {
      newDirection = "desc";
    } else {
      newDirection = null;
    }

    this._sortingManager.addSort(columnIndex, newDirection);
    this.applyFiltersAndSorting();
  }

  private handleHeaderRightClick(event: MouseEvent, columnIndex: number): void {
    event.preventDefault();
    const header = this.headers[columnIndex];
    if (!header.sortable) return;

    this.showContextMenu(event.clientX, event.clientY, columnIndex);
  }




private showContextMenu(x: number, y: number, columnIndex: number): void {

  this.hideContextMenu();

  const container = this.shadow.querySelector(".gridie-container") as HTMLElement;
  if (!container) return;

  const menu = document.createElement("div");
  menu.className = "gridie-context-menu";

  // ✅ SOLUCIÓN: Usar position: absolute respecto al container
  const containerRect = container.getBoundingClientRect();
  
  // Convertir coordenadas del viewport a coordenadas del container
  const relativeX = x - containerRect.left + container.scrollLeft;
  const relativeY = y - containerRect.top + container.scrollTop;

  menu.style.position = "absolute";
  menu.style.left = `${relativeX}px`;
  menu.style.top = `${relativeY}px`;
  menu.style.zIndex = "10000";

  const hasMultipleSorts = this._sortingManager.getAllSorts().length > 1;
  const hasColumnSort = this._sortingManager.getColumnSort(columnIndex) !== null;

  menu.innerHTML = `
    <div class="context-menu-item sort-asc-item" data-action="sort-asc">
      <div class="sort-icon">${getFilterIcon("ascending")}</div>
      <div class="sort-text">${this._lang.sorting.sortAscending}</div>
    </div>

    <div class="context-menu-item sort-desc-item" data-action="sort-desc">
      <div class="sort-icon">${getFilterIcon("descending")}</div>
      <div class="sort-text">${this._lang.sorting.sortDescending}</div>
    </div>

    ${hasColumnSort ? `
      <div class="context-menu-divider"></div>

      <div class="context-menu-item clear-sort-item" data-action="clear-sort">
        <div class="sort-icon">${getFilterIcon("clearSorting")}</div>
        <div class="sort-text">${this._lang.sorting.clearSorting}</div>
      </div>
    ` : ""}

    ${hasMultipleSorts ? `
      <div class="context-menu-divider"></div>

      <div class="context-menu-item clear-all-sort-item" data-action="clear-all-sort">
        <div class="sort-icon">${getFilterIcon("clearAllSorting")}</div>
        <div class="sort-text">${this._lang.sorting.clearAllSorting}</div>
      </div>
    ` : ""}
  `;

  menu.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest(".context-menu-item") as HTMLElement;
    if (!target) return;

    const action = target.dataset.action;
    if (action) {
      this.handleContextMenuAction(action, columnIndex);
      this.hideContextMenu();
    }
  });

  container.appendChild(menu);
  this._contextMenu = menu;

  // ✅ Ajustar si se sale del contenedor
  requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let finalX = relativeX;
    let finalY = relativeY;

    // Si se sale por la derecha
    if (menuRect.right > containerRect.right) {
      finalX = containerRect.width - menuRect.width - 10 + container.scrollLeft;
    }

    // Si se sale por abajo
    if (menuRect.bottom > containerRect.bottom) {
      finalY = relativeY - menuRect.height;
    }

    // Si se sale por la izquierda
    if (finalX < 10) {
      finalX = 10;
    }

    // Si se sale por arriba
    if (finalY < 10) {
      finalY = 10;
    }

    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;
  });
}

  private hideContextMenu(): void {
    if (this._contextMenu) {
      //  CAMBIO: Remover del contenedor en lugar de document.body
      const container = this.shadow.querySelector(
        ".gridie-container"
      ) as HTMLElement;
      if (container && container.contains(this._contextMenu)) {
        container.removeChild(this._contextMenu);
      }
      this._contextMenu = null;
    }
  }

  private handleContextMenuAction(action: string, columnIndex: number): void {
    switch (action) {
      case "sort-asc":
        this._sortingManager.addSort(columnIndex, "asc");
        break;
      case "sort-desc":
        this._sortingManager.addSort(columnIndex, "desc");
        break;
      case "clear-sort":
        this._sortingManager.clearColumn(columnIndex);
        break;
      case "clear-all-sort":
        this._sortingManager.clearAll();
        break;
    }
    this.applyFiltersAndSorting();
  }



private updatePagination(): void {
  // Si paginación no está habilitada o no es modo cliente, salir
  if (!this._config.paging?.enabled || this._config.mode !== "client") {
    this._pagedBody = this._body;
    return;
  }

  // ✅ CORRECCIÓN: Calcular totales basándose en _body (que ya está filtrado)
  // _body ya contiene los datos filtrados después de applyFiltersAndSorting()
  this._totalItems = this._body.length;
  this._totalPages = Math.ceil(this._totalItems / this._pageSize) || 1;

  // ✅ NUEVO: Si la página actual excede el total después del filtro, ir a la última página
  if (this._currentPage > this._totalPages) {
    this._currentPage = this._totalPages;
  }
  if (this._currentPage < 1) {
    this._currentPage = 1;
  }

  // Calcular slice de datos para página actual
  const startIndex = (this._currentPage - 1) * this._pageSize;
  const endIndex = startIndex + this._pageSize;

  this._pagedBody = this._body.slice(startIndex, endIndex);
  
 // console.log(`📄 Paginación: Página ${this._currentPage}/${this._totalPages}, mostrando ${this._pagedBody.length} de ${this._totalItems} items (filtrados de ${this._originalBody.length} totales)`);
}


// ============================================================================
// MÉTODO applyFiltersAndSorting() CON DEBUG
// Copia TODO este método en tu gridie.ts
// ============================================================================

// ============================================================================
// MÉTODO applyFiltersAndSorting() - VERSIÓN SIMPLE
// Copia este método COMPLETO en tu gridie.ts (reemplaza el que tienes)
// ============================================================================

private applyFiltersAndSorting(): void {
  // 1. ✅ Aplicar TODOS los filtros (FilterRow + HeaderFilter) usando FilteringManager
  let filtered = this._filteringManager.applyFilters(
    this._originalBody,
    this.headers
  );

  // 2. ✅ Aplicar filtros adicionales de _headerFilterSelections si existen
  if (this._headerFilterSelections && this._headerFilterSelections.size > 0) {
    filtered = filtered.filter((row: any) => {
      for (const [colIndex, selections] of this._headerFilterSelections.entries()) {
        if (selections.size === 0) continue;

        // ✅ Usar getCellValueByPositionFiltered
        const cellValue = this.getCellValueByPositionFiltered(row, colIndex);
        const header = this.headers[colIndex];

        let matchFound = false;

        for (const selection of selections) {
          if (typeof selection === "object" && selection.operator) {
            if (selection.operator === "year" || selection.operator === "month") {
              const date = new Date(cellValue);
              if (isNaN(date.getTime())) continue;

              switch (selection.operator) {
                case "year":
                  if (date.getUTCFullYear() === selection.value)
                    matchFound = true;
                  break;
                case "month":
                  if (
                    date.getUTCFullYear() === selection.year &&
                    date.getUTCMonth() === selection.value
                  ) {
                    matchFound = true;
                  }
                  break;
              }
            } else {
              let valueToCompare = cellValue;
              
              if (header.type === "number") {
                valueToCompare = typeof cellValue === "string" 
                  ? parseFloat(cellValue) 
                  : cellValue;
                
                if (isNaN(valueToCompare)) continue;
              }
              
              const result = this.evaluateParameterFilter(
                valueToCompare,
                selection,
                header.type
              );

              if (result) {
                matchFound = true;
              }
            }
          } else {
            if (header.type === "date") {
              const selectionStr = String(selection);
              const isHourFilter = /T\d{2}:\d{2}/.test(selectionStr);

              if (isHourFilter) {
                const normalizedCell = this.normalizeDateTimeToISO(cellValue);
                const normalizedSelection = this.normalizeDateTimeToISO(selection);

                if (normalizedCell === normalizedSelection) {
                  matchFound = true;
                  break;
                }
              } else {
                const normalizedCell = this.normalizeDateToYYYYMMDD(cellValue);
                const normalizedSelection = this.normalizeDateToYYYYMMDD(selection);

                if (normalizedCell === normalizedSelection) {
                  matchFound = true;
                  break;
                }
              }
            } else {
              if (
                cellValue === selection ||
                String(cellValue) === String(selection)
              ) {
                matchFound = true;
                break;
              }
            }
          }
        }

        if (!matchFound) return false;
      }

      return true;
    });
  }

  this._filteredBody = filtered;

  // 3. Aplicar sorting
  this._body = this._sortingManager.applySorts(
    this._filteredBody,
    this.headers
  );

  // 4. Actualizar paginación y UI
  this.updatePagination();
  this.updateTableContent();
  
  if (this._config.paging?.enabled) {
    this.updatePaginationFooter();
  }
}

private evaluateParameterFilter(
  cellValue: any,
  parameter: HeaderFilterParameter,
  columnType?: string
): boolean {
  const operator = parameter.operator;
  const filterValue = parameter.value;
  const filterValue2 = parameter.value2;

 // console.log("      🔧 evaluateParameterFilter");
 // console.log("        cellValue:", cellValue, `(tipo: ${typeof cellValue})`);
 // console.log("        operator:", operator);
 // console.log("        filterValue:", filterValue);
 // console.log("        filterValue2:", filterValue2);
 // console.log("        columnType:", columnType);

  //  NUEVO: Operador "in" para arrays
  if (operator === "in") {
    if (!Array.isArray(filterValue)) {
    //  console.log("        ❌ 'in': filterValue no es un array");
      return false;
    }
    const result = filterValue.includes(cellValue);
   // console.log(`        in : ${JSON.stringify(filterValue)}.includes(${cellValue}) = ${result}`);
    return result;
  }

  //  NUEVO: Operador "notin" para arrays
  if (operator === "notin") {
    if (!Array.isArray(filterValue)) {
    //  console.log("        ❌ 'notin': filterValue no es un array");
      return false;
    }
    const result = !filterValue.includes(cellValue);
   // console.log(`        notin : !${JSON.stringify(filterValue)}.includes(${cellValue}) = ${result}`);
    return result;
  }

  // Para tipos numéricos, asegurar que ambos valores sean números
  if (columnType === "number") {
    const numCellValue = typeof cellValue === "number" ? cellValue : parseFloat(cellValue);
    const numFilterValue = typeof filterValue === "number" ? filterValue : parseFloat(filterValue);
    
   // console.log("        numCellValue:", numCellValue);
   // console.log("        numFilterValue:", numFilterValue);
    
    if (isNaN(numCellValue) || isNaN(numFilterValue)) {
    //  console.log("        ❌ Valores inválidos (NaN)");
      return false;
    }

    switch (operator) {
      case "=":
      case "equals":
        const equalsResult = numCellValue === numFilterValue;
      //  console.log(`        = : ${numCellValue} === ${numFilterValue} = ${equalsResult}`);
        return equalsResult;
      case "<>":
      case "notequal":
        const notEqualResult = numCellValue !== numFilterValue;
      //  console.log(`        <> : ${numCellValue} !== ${numFilterValue} = ${notEqualResult}`);
        return notEqualResult;
      case "<":
        const ltResult = numCellValue < numFilterValue;
      //  console.log(`        < : ${numCellValue} < ${numFilterValue} = ${ltResult}`);
        return ltResult;
      case ">":
        const gtResult = numCellValue > numFilterValue;
      //  console.log(`        > : ${numCellValue} > ${numFilterValue} = ${gtResult}`);
        return gtResult;
      case "<=":
        const lteResult = numCellValue <= numFilterValue;
      //  console.log(`        <= : ${numCellValue} <= ${numFilterValue} = ${lteResult}`);
        return lteResult;
      case ">=":
        const gteResult = numCellValue >= numFilterValue;
      //  console.log(`        >= : ${numCellValue} >= ${numFilterValue} = ${gteResult}`);
        return gteResult;
      case "between":
        if (filterValue2 === undefined) {
        //  console.log("        ❌ between: falta filterValue2");
          return false;
        }
        const numFilterValue2 = typeof filterValue2 === "number" ? filterValue2 : parseFloat(filterValue2);
        if (isNaN(numFilterValue2)) {
        //  console.log("        ❌ between: filterValue2 es NaN");
          return false;
        }
        const betweenResult = numCellValue >= numFilterValue && numCellValue <= numFilterValue2;
      //  console.log(`        between : ${numCellValue} >= ${numFilterValue} && ${numCellValue} <= ${numFilterValue2} = ${betweenResult}`);
        return betweenResult;
      default:
      //  console.log("        ❌ Operador no reconocido:", operator);
        return false;
    }
  }

  // Para fechas
  if (columnType === "date") {
    const cellDate = new Date(cellValue);
    const filterDate = new Date(filterValue);
    
    if (isNaN(cellDate.getTime()) || isNaN(filterDate.getTime())) return false;

    switch (operator) {
      case "=":
      case "equals":
        return cellDate.getTime() === filterDate.getTime();
      case "<>":
      case "notequal":
        return cellDate.getTime() !== filterDate.getTime();
      case "<":
        return cellDate.getTime() < filterDate.getTime();
      case ">":
        return cellDate.getTime() > filterDate.getTime();
      case "<=":
        return cellDate.getTime() <= filterDate.getTime();
      case ">=":
        return cellDate.getTime() >= filterDate.getTime();
      case "between":
        if (filterValue2 === undefined) return false;
        const filterDate2 = new Date(filterValue2);
        if (isNaN(filterDate2.getTime())) return false;
        return cellDate.getTime() >= filterDate.getTime() && 
               cellDate.getTime() <= filterDate2.getTime();
      default:
        return false;
    }
  }

  // Para strings
  const cellStr = String(cellValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  switch (operator) {
    case "=":
    case "equals":
      return cellStr === filterStr;
    case "<>":
    case "notequal":
      return cellStr !== filterStr;
    case "contains":
      return cellStr.includes(filterStr);
    case "notcontains":
      return !cellStr.includes(filterStr);
    case "startswith":
      return cellStr.startsWith(filterStr);
    case "endswith":
      return cellStr.endsWith(filterStr);
    default:
      return false;
  }
}




  private normalizeDateToISOString(value: any): string {
    if (!value) return "";

    const str = String(value);

    // Si ya es ISO string completo, retornar
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
      // Asegurar que termine con 'Z' o tenga timezone
      if (!str.endsWith("Z") && !str.includes("+") && !str.includes("GMT")) {
        return str + "Z";
      }
      return str;
    }

    // Convertir a Date y obtener ISO string
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      // Ignorar
    }

    return "";
  }
  private normalizeDateToYYYYMMDD(value: any): string {
    if (!value) return "";

    const str = String(value);

    // console.log(
    //   `🔍 normalizeDateToYYYYMMDD input:`,
    //   value,
    //   `(type: ${typeof value})`
    // );

    //  Caso 1: Ya es "YYYY-MM-DD" exacto → retornar directo
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
   //   console.log(`   Already normalized:`, str);
      return str;
    }

    //  Caso 2: Es ISO con hora "YYYY-MM-DDTHH:mm:ss" → extraer fecha
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      const result = str.split("T")[0];
    //  console.log(`   Extracted from ISO:`, result);
      return result;
    }

    //  Caso 3: Es un Date object o timestamp → convertir USANDO UTC
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
       //`  📅 Date object:`, date);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const result = `${year}-${month}-${day}`;
       // console.log(`   Converted to:`, result);
        return result;
      }
    } catch (error) {
      console.log(`   Error:`, error);
    }

    //console.log(`  Could not normalize`);
    return "";
  }

private updateTableContent(): void {
  //  AGREGAR STACK TRACE:
 // console.trace("📊 updateTableContent llamado desde:");
  //console.log("📊 Filas a renderizar:", this.body.length);
  
  const thead = this.shadow.querySelector("thead tr:first-child");
  if (thead) {
    const headers = this.headers;
    thead.innerHTML = headers
      .map(
        (header, index) => `
     <th 
  class="${header.sortable ? "sortable" : ""}" 
  data-column-index="${index}"
>
  <div class="th-content">

    <div class="th-filter-icon">
      ${this.renderHeaderFilterIcon(index, header)}
    </div>

    <div class="th-label">
      ${header.label}
    </div>

    <div class="th-sort-indicator">
      ${this.getSortIndicator(index)}
    </div>

  </div>
</th>

    `
      )
      .join("");

    this.attachHeaderEvents();
    this.attachHeaderFilterEvents();
  }

  this.renderTableBody();
}

 private renderTableBody(): void {
  const tbody = this.shadow.querySelector("tbody");
  if (!tbody) {
    this.render();
    return;
  }

  const headers = this.headers;
  
  // ✅ CAMBIO CRÍTICO: Usar _pagedBody si paginación está activa
  const body = this._config.paging?.enabled && this._config.mode === "client"
    ? this._pagedBody
    : this._body;

  tbody.innerHTML =
    body.length > 0
      ? body
          .map(
            (row, rowIndex) => `
      <tr data-index="${rowIndex}">
        ${headers
          .map(
            (header, colIndex) =>
              `<td>${this.renderCell(row, header, colIndex, rowIndex)}</td>`
          )
          .join("")}
      </tr>
    `
          )
          .join("")
      : `<tr><td colspan="${headers.length}" class="no-data">${this._lang.table.noData}</td></tr>`;

  this.attachActionEvents();
}

  // Reemplaza este método en gridie.ts:



  /**
 * Re-renderiza solo el footer de paginación (más eficiente)
 */
private updatePaginationFooter(): void {
  if (!this._config.paging?.enabled) return;
  
  const footers = this.shadow.querySelectorAll('.gridie-pagination-footer');
  
  footers.forEach(footer => {
    const position = (footer as HTMLElement).dataset.position as 'top' | 'bottom';
    const newFooterHTML = this.renderSingleFooter(position);
    
    // Crear un contenedor temporal
    const temp = document.createElement('div');
    temp.innerHTML = newFooterHTML;
    const newFooter = temp.firstElementChild as HTMLElement;
    
    // Reemplazar el footer antiguo
    footer.parentNode?.replaceChild(newFooter, footer);
  });
  
  // Re-adjuntar eventos
  this.attachPaginationEvents();
}


  private handleOperatorChange(columnIndex: number): void {
    // Guardar scroll
    const container = this.shadow.querySelector(
      ".gridie-container"
    ) as HTMLElement;
    const scrollLeft = container?.scrollLeft || 0;
    const scrollTop = container?.scrollTop || 0;

    const operatorSelect = this.shadow.querySelector(
      `select.filter-operator[data-column-index="${columnIndex}"]`
    ) as HTMLSelectElement;

    if (!operatorSelect) return;

    const newOperator = operatorSelect.value as FilterOperator;

    // Obtener el filtro actual ANTES de cambiar
    const currentFilter = this._filteringManager.getColumnFilter(columnIndex);
    const oldOperator =
      currentFilter?.operator ||
      this.getOperatorsForColumn(this.headers[columnIndex])[0];

    //  CRITICAL: Detectar si cambió entre "between" y otro operador
    const wasBetween = oldOperator === "between";
    const isNowBetween = newOperator === "between";

    //  CRITICAL: Si cambió el layout, re-renderizar INMEDIATAMENTE
    if (wasBetween !== isNowBetween) {
      //  FIX: Actualizar el operador en el manager con el nuevo operador
      if (isNowBetween) {
        // Cambió A "between"
        this._filteringManager.addFilter(columnIndex, newOperator, "", "");
      } else {
        // Cambió DESDE "between" a otro operador
        const currentValue = currentFilter?.value || "";
        if (currentValue) {
          // Mantener el primer valor si existe
          this._filteringManager.addFilter(
            columnIndex,
            newOperator,
            currentValue
          );
        } else {
          // Limpiar si no hay valor
          this._filteringManager.clearFilterValue(columnIndex);
        }
      }

      // Re-renderizar la fila de filtros
      this.renderFilterRowOnly();
      this.attachFilterEvents();

      // Restaurar scroll y foco
      setTimeout(() => {
        if (container) {
          container.scrollLeft = scrollLeft;
          container.scrollTop = scrollTop;
        }

        const newSelect = this.shadow.querySelector(
          `select.filter-operator[data-column-index="${columnIndex}"]`
        ) as HTMLSelectElement;
        if (newSelect) {
          newSelect.focus();
        }
      }, 0);

      //  FIX: Aplicar filtros después de cambiar el layout
      this.applyFiltersAndSorting();

      return; // ← Salir aquí
    }

    // Si no cambió el layout, aplicar el filtro normalmente
    this.handleFilterChange(columnIndex, false);
  }
  private renderFilterRowOnly(): void {
    const filterRow = this.shadow.querySelector(".filter-row");
    if (!filterRow) return;

    const headers = this.headers;

    filterRow.innerHTML = headers
      .map((header, index) => {
        if (!header.filters?.filterRow?.visible) {
          return `<td></td>`;
        }

        const operators = this.getOperatorsForColumn(header);
        const currentFilter = this._filteringManager.getColumnFilter(index);
        const currentOperator = this.getCurrentOperator(index);
        const currentValue = currentFilter?.value || "";
        const currentValue2 = currentFilter?.value2 || "";

        // Layout especial para "between"
        if (currentOperator === "between") {
          return `
        <td>
          <div class="filter-cell">
            <div class="filter-cell-row">
              ${this.renderOperatorDropdown(index, operators, currentOperator)}
              <div class="filter-between-container">
                <div class="filter-between-row">
                  <span class="filter-between-label">${
                    this._lang.filtering.placeholders.betweenFrom
                  }</span>
                  ${this.renderFilterInput(
                    header,
                    index,
                    currentOperator,
                    currentValue,
                    false
                  )}
                </div>
                <div class="filter-between-row">
                  <span class="filter-between-label">${
                    this._lang.filtering.placeholders.betweenTo
                  }</span>
                  ${this.renderFilterInput(
                    header,
                    index,
                    currentOperator,
                    currentValue2,
                    true
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      `;
        }

        // Layout normal para otros operadores
        return `
      <td>
        <div class="filter-cell">
          <div class="filter-cell-row">
            ${this.renderOperatorDropdown(index, operators, currentOperator)}
            ${this.renderFilterInput(
              header,
              index,
              currentOperator,
              currentValue,
              false
            )}
          </div>
        </div>
      </td>
    `;
      })
      .join("");
  }

  private toggleOperatorDropdown(columnIndex: number): void {
    if (this._activeOperatorDropdown === columnIndex) {
      this.closeOperatorDropdown();
    } else {
      this.openOperatorDropdown(columnIndex);
    }
  }



private openOperatorDropdown(columnIndex: number): void {
  this.closeOperatorDropdown();

  this._activeOperatorDropdown = columnIndex;

  const trigger = this.shadow.querySelector(
    `.filter-operator-trigger[data-column-index="${columnIndex}"]`
  ) as HTMLElement;
  const menu = this.shadow.querySelector(
    `.filter-operator-menu[data-column-index="${columnIndex}"]`
  ) as HTMLElement;

  if (trigger && menu) {
    trigger.classList.add("active");
    menu.classList.add("active");
    
    // ✅ SOLO ajustar si se sale del viewport (sin tocar left/top)
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const containerRect = this.shadow.querySelector(".gridie-container")?.getBoundingClientRect();
      
      if (!containerRect) return;

      // Si se sale por la derecha, cambiar a alineación derecha
      if (menuRect.right > Math.min(viewportWidth, containerRect.right) - 10) {
        menu.style.left = 'auto';
        menu.style.right = '0';
      }

      // Si se sale por abajo, mostrar arriba del trigger
      if (menuRect.bottom > Math.min(viewportHeight, containerRect.bottom) - 10) {
        menu.style.top = 'auto';
        menu.style.bottom = 'calc(100% + 2px)';
      }

      // Si aún se sale por arriba, limitar altura
      const menuRectUpdated = menu.getBoundingClientRect();
      if (menuRectUpdated.top < 10) {
        const maxHeight = Math.min(viewportHeight, containerRect.height) - 40;
        menu.style.maxHeight = `${maxHeight}px`;
        menu.style.overflowY = 'auto';
      }
    });
  }
}

  private closeOperatorDropdown(): void {
    if (this._activeOperatorDropdown === null) return;

    const trigger = this.shadow.querySelector(
      `.filter-operator-trigger[data-column-index="${this._activeOperatorDropdown}"]`
    ) as HTMLElement;
    const menu = this.shadow.querySelector(
      `.filter-operator-menu[data-column-index="${this._activeOperatorDropdown}"]`
    ) as HTMLElement;

    if (trigger && menu) {
      trigger.classList.remove("active");
      menu.classList.remove("active");
    }

    this._activeOperatorDropdown = null;
  }

  private handleOperatorSelect(
    columnIndex: number,
    newOperator: FilterOperator
  ): void {
    this.closeOperatorDropdown();

    // Guardar scroll
    const container = this.shadow.querySelector(
      ".gridie-container"
    ) as HTMLElement;
    const scrollLeft = container?.scrollLeft || 0;
    const scrollTop = container?.scrollTop || 0;

    // Obtener el operador actual
    const oldOperator = this.getCurrentOperator(columnIndex);

    // Si no cambió, no hacer nada
    if (oldOperator === newOperator) return;

    //  SIEMPRE guardar el operador seleccionado
    this._selectedOperators.set(columnIndex, newOperator);

    const currentFilter = this._filteringManager.getColumnFilter(columnIndex);
    const wasBetween = oldOperator === "between";
    const isNowBetween = newOperator === "between";
    const currentValue = currentFilter?.value || "";
    const currentValue2 = currentFilter?.value2 || "";

    // Actualizar el filtro en el manager solo si hay valor
    if (isNowBetween) {
      // Cambió A "between" - inicializar con valores vacíos si no hay filtro
      if (!currentFilter) {
        // No agregamos al manager aún, solo guardamos la selección
      } else {
        this._filteringManager.addFilter(columnIndex, newOperator, "", "");
      }
    } else if (wasBetween) {
      // Cambió DESDE "between" - mantener primer valor si existe
      if (currentValue) {
        this._filteringManager.addFilter(
          columnIndex,
          newOperator,
          currentValue
        );
      } else {
        this._filteringManager.clearFilterValue(columnIndex);
      }
    } else {
      // Cambió entre operadores normales - mantener valor si existe
      if (currentValue) {
        this._filteringManager.addFilter(
          columnIndex,
          newOperator,
          currentValue,
          currentValue2
        );
      }
      // Si no hay valor, no hacemos nada en el manager (ya guardamos en _selectedOperators)
    }

    //  CRÍTICO: SIEMPRE re-renderizar para actualizar el icono
    this.renderFilterRowOnly();
    this.attachFilterEvents();

    // Solo aplicar filtros si hay valor
    if (currentValue) {
      this.applyFiltersAndSorting();
    }

    // Restaurar scroll
    setTimeout(() => {
      if (container) {
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    }, 0);
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Cerrar context menu
    if (this._contextMenu && !this._contextMenu.contains(target)) {
      this.hideContextMenu();
    }

    // Cerrar operator dropdown si se hace clic fuera
    if (this._activeOperatorDropdown !== null) {
      const operatorMenu = this.shadow.querySelector(
        `.filter-operator-menu[data-column-index="${this._activeOperatorDropdown}"]`
      );
      const operatorTrigger = this.shadow.querySelector(
        `.filter-operator-trigger[data-column-index="${this._activeOperatorDropdown}"]`
      );

      if (
        operatorMenu &&
        !operatorMenu.contains(target) &&
        operatorTrigger &&
        !operatorTrigger.contains(target)
      ) {
        this.closeOperatorDropdown();
      }
    }

    //  CORREGIDO: Cerrar header filter dropdown si se hace clic fuera
    if (this._headerFilterMenu && this._activeHeaderFilterDropdown !== null) {
      const clickedInsideMenu = this._headerFilterMenu.contains(target);
      const clickedIcon = this.shadow.querySelector(
        `.header-filter-icon[data-header-filter-column="${this._activeHeaderFilterDropdown}"]`
      );
      const clickedInsideIcon = clickedIcon && clickedIcon.contains(target);

      // Solo cerrar si el clic fue FUERA del menú Y del icono
      if (!clickedInsideMenu && !clickedInsideIcon) {
        this.closeHeaderFilterDropdown();
      }
    }
  }

  // Generar opciones para el Header Filter
 private generateHeaderFilterOptions(
  columnIndex: number,
  header: GridieHeaderConfig
): any[] {
  const config = header.filters?.headerFilter;
  if (!config) return [];

  const options: any[] = [];

  // Si hay parameters definidos, agregarlos primero
  if (config.parameters && config.parameters.length > 0) {
    config.parameters.forEach((param) => {
      const count = this.countMatchingRows(columnIndex, param);
      options.push({
        text: param.text,
        //  CORRECCIÓN: No incluir 'text' en el value, solo los datos del filtro
        value: {
          operator: param.operator,
          value: param.value,
          value2: param.value2,
          unit: param.unit,
          year: param.year,
        },
        count: count,
        isParameter: true,
      });
    });

    // Agregar separador si también hay values
    if (config.values && config.values.length > 0) {
      options.push({ separator: true });
    }
  }

  // Si hay values definidos, agregarlos
  if (config.values && config.values.length > 0) {
    config.values.forEach((val) => {
      const count = this.countValueOccurrences(columnIndex, val);
      options.push({
        text: this.formatValueForDisplay(val, header.type),
        value: val,
        count: count,
        isParameter: false,
      });
    });
  } else if (!config.parameters) {
    // Si no hay ni parameters ni values, extraer valores únicos automáticamente
    const uniqueValues = this.extractUniqueValues(columnIndex);

    // Si hay jerarquía de fechas, procesar diferente
    if (config.dateHierarchy && config.dateHierarchy.length > 0) {
      return this.generateDateHierarchy(columnIndex, uniqueValues, config);
    }

    // Valores únicos normales
    uniqueValues.forEach((val) => {
      const count = this.countValueOccurrences(columnIndex, val);
      options.push({
        text: this.formatValueForDisplay(val, header.type),
        value: val,
        count: count,
        isParameter: false,
      });
    });
  }

  return options;
}

  // Extraer valores únicos de una columna
  // private extractUniqueValues(columnIndex: number): any[] {
  //   const values = new Set<any>();

  //   this._originalBody.forEach((row) => {
  //     const cellValue = this.getCellValueByPosition(row, columnIndex);
  //     if (cellValue !== null && cellValue !== undefined) {
  //       values.add(cellValue);
  //     }
  //   });

  //   const result = Array.from(values).sort();

 
  //   // console.log(
  //   //   `🔍 extractUniqueValues for column ${columnIndex} (${this.headers[columnIndex]?.label}):`,
  //   //   result
  //   // );

  //   return result;
  // }

  private extractUniqueValues(columnIndex: number): any[] {
  const values = new Set<any>();

  this._originalBody.forEach((row) => {
    // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered
    const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
    if (cellValue !== null && cellValue !== undefined) {
      values.add(cellValue);
    }
  });

  const result = Array.from(values).sort();

  return result;
}

  // Contar cuántas filas coinciden con un parameter
  // private countMatchingRows(
  //   columnIndex: number,
  //   parameter: HeaderFilterParameter
  // ): number {
  //   let count = 0;
  //   const header = this.headers[columnIndex];

  //   this._originalBody.forEach((row) => {
  //     const cellValue = this.getCellValueByPosition(row, columnIndex);

  //     // Crear un FilterState temporal para evaluar
  //     const tempFilter: FilterState = {
  //       columnIndex: columnIndex,
  //       operator: parameter.operator,
  //       value: parameter.value,
  //       value2: parameter.value2,
  //       unit: parameter.unit,
  //       year: parameter.year,
  //     };

  //     if (
  //       this._filteringManager["evaluateFilter"](
  //         cellValue,
  //         tempFilter,
  //         header.type
  //       )
  //     ) {
  //       count++;
  //     }
  //   });

  //   return count;
  // }
  private countMatchingRows(
  columnIndex: number,
  parameter: HeaderFilterParameter
): number {
  let count = 0;
  const header = this.headers[columnIndex];

  this._originalBody.forEach((row) => {
    // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered
    const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);

    // Crear un FilterState temporal para evaluar
    const tempFilter: FilterState = {
      columnIndex: columnIndex,
      operator: parameter.operator,
      value: parameter.value,
      value2: parameter.value2,
      unit: parameter.unit,
      year: parameter.year,
    };

    if (
      this._filteringManager["evaluateFilter"](
        cellValue,
        tempFilter,
        header.type
      )
    ) {
      count++;
    }
  });

  return count;
}

  // Contar cuántas veces aparece un valor en la columna
  // private countValueOccurrences(columnIndex: number, value: any): number {
  //   let count = 0;

  //   this._originalBody.forEach((row) => {
  //     const cellValue = this.getCellValueByPosition(row, columnIndex);
  //     if (cellValue === value || String(cellValue) === String(value)) {
  //       count++;
  //     }
  //   });

  //   return count;
  // }

  private countValueOccurrences(columnIndex: number, value: any): number {
  let count = 0;

  this._originalBody.forEach((row) => {
    // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered
    const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
    if (cellValue === value || String(cellValue) === String(value)) {
      count++;
    }
  });

  return count;
}

  // Formatear valor para mostrar en el menú
  private formatValueForDisplay(value: any, type?: string): string {
    if (value === null || value === undefined || value === "") {
      return "(Vacío)";
    }

    switch (type) {
      case "boolean":
        return value
          ? this._lang.filtering.booleanOptions.true
          : this._lang.filtering.booleanOptions.false;
      case "date":
        return new Date(value).toLocaleDateString(
          this._language === "es" ? "es-ES" : "en-US"
        );
      case "datetime":
        return new Date(value).toLocaleString(
          this._language === "es" ? "es-ES" : "en-US"
        );
      case "number":
        return typeof value === "number"
          ? value.toLocaleString()
          : String(value);
      default:
        return String(value);
    }
  }

private generateDateHierarchy(
  columnIndex: number,
  uniqueValues: any[],
  config: GridieHeaderFilterConfig
): any[] {
  const hierarchy = config.dateHierarchy || [];
  if (hierarchy.length === 0) return [];

  const options: any[] = [];

  // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered en countRowsForYear
  const countRowsForYear = (year: number): number => {
    return this._originalBody.filter((row: any) => {
      const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
      if (!cellValue) return false;
      const date = new Date(cellValue);
      return !isNaN(date.getTime()) && date.getUTCFullYear() === year;
    }).length;
  };

  // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered en countRowsForMonth
  const countRowsForMonth = (year: number, month: number): number => {
    return this._originalBody.filter((row: any) => {
      const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
      if (!cellValue) return false;
      const date = new Date(cellValue);
      return (
        !isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month
      );
    }).length;
  };

  // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered en countRowsForDay
  const countRowsForDay = (
    year: number,
    month: number,
    day: number
  ): number => {
    return this._originalBody.filter((row: any) => {
      const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
      if (!cellValue) return false;
      const date = new Date(cellValue);
      return (
        !isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month &&
        date.getUTCDate() === day
      );
    }).length;
  };

  // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered en countRowsForHour
  const countRowsForHour = (
    year: number,
    month: number,
    day: number,
    hour: number
  ): number => {
    return this._originalBody.filter((row: any) => {
      const cellValue = this.getCellValueByPositionFiltered(row, columnIndex);
      if (!cellValue) return false;
      const date = new Date(cellValue);
      return (
        !isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month &&
        date.getUTCDate() === day &&
        date.getUTCHours() === hour
      );
    }).length;
  };

  // Convertir todos los valores a fechas
  const dates = uniqueValues
    .map((val: any) => new Date(val))
    .filter((date: Date) => !isNaN(date.getTime()))
    .sort((a: Date, b: Date) => a.getTime() - b.getTime());

  if (dates.length === 0) return [];

  // Agrupar por año (UTC)
  const yearGroups = new Map<number, Date[]>();
  dates.forEach((date: Date) => {
    const year = date.getUTCFullYear();
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(date);
  });

  // Ordenar años (más reciente primero)
  const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);

  sortedYears.forEach((year: number) => {
    const yearDates = yearGroups.get(year)!;
    const yearId = `${columnIndex}-year-${year}`;
    const yearCount = countRowsForYear(year);

    if (hierarchy.length === 1 && hierarchy[0] === "year") {
      options.push({
        text: String(year),
        value: { operator: "year", value: year },
        count: yearCount,
        isParameter: true,
        level: 0,
        id: yearId,
      });
    } else if (hierarchy.includes("month")) {
      // Agrupar por mes (UTC)
      const monthGroups = new Map<number, Date[]>();
      yearDates.forEach((date: Date) => {
        const month = date.getUTCMonth();
        if (!monthGroups.has(month)) {
          monthGroups.set(month, []);
        }
        monthGroups.get(month)!.push(date);
      });

      const yearExpanded =
        this._headerFilterExpandedState.get(yearId) || false;
      const yearOption: any = {
        text: String(year),
        value: null,
        count: yearCount,
        isParameter: false,
        level: 0,
        expandable: true,
        expanded: yearExpanded,
        id: yearId,
        children: [],
      };
      options.push(yearOption);

      const sortedMonths = Array.from(monthGroups.keys()).sort(
        (a, b) => a - b
      );

      sortedMonths.forEach((month: number) => {
        const monthDates = monthGroups.get(month)!;
        const monthNames = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        const monthName = monthNames[month];
        const monthId = `${columnIndex}-month-${year}-${month}`;
        const monthCount = countRowsForMonth(year, month);

        if (hierarchy.length === 2) {
          yearOption.children.push({
            text: monthName,
            value: { operator: "month", value: month, year: year },
            count: monthCount,
            isParameter: true,
            level: 1,
            id: monthId,
          });
        } else if (hierarchy.includes("day")) {
          // Agrupar por día (UTC)
          const dayGroups = new Map<number, Date[]>();
          monthDates.forEach((date: Date) => {
            const day = date.getUTCDate();
            if (!dayGroups.has(day)) {
              dayGroups.set(day, []);
            }
            dayGroups.get(day)!.push(date);
          });

          const monthExpanded =
            this._headerFilterExpandedState.get(monthId) || false;
          const monthOption: any = {
            text: monthName,
            value: null,
            count: monthCount,
            isParameter: false,
            level: 1,
            expandable: true,
            expanded: monthExpanded,
            id: monthId,
            children: [],
          };
          yearOption.children.push(monthOption);

          const sortedDays = Array.from(dayGroups.keys()).sort(
            (a, b) => a - b
          );

          sortedDays.forEach((day: number) => {
            const dayDates = dayGroups.get(day)!;
            const dayId = `${columnIndex}-day-${year}-${month}-${day}`;
            const dayCount = countRowsForDay(year, month, day);

            if (hierarchy.length === 3 || !hierarchy.includes("hour")) {
              const dateStr = `${year}-${String(month + 1).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              monthOption.children.push({
                text: `${day} de ${monthName}`,
                value: dateStr,
                count: dayCount,
                isParameter: false,
                expandable: false,
                level: 2,
                id: dayId,
              });
            } else if (hierarchy.includes("hour")) {
              // Agrupar por hora (UTC)
              const hourGroups = new Map<number, Date[]>();
              dayDates.forEach((date: Date) => {
                const hour = date.getUTCHours();
                if (!hourGroups.has(hour)) {
                  hourGroups.set(hour, []);
                }
                hourGroups.get(hour)!.push(date);
              });

              const dayExpanded =
                this._headerFilterExpandedState.get(dayId) || false;
              const dayOption: any = {
                text: `${day} de ${monthName}`,
                value: null,
                count: dayCount,
                isParameter: false,
                level: 2,
                expandable: true,
                expanded: dayExpanded,
                id: dayId,
                children: [],
              };
              monthOption.children.push(dayOption);

              const sortedHours = Array.from(hourGroups.keys()).sort(
                (a, b) => a - b
              );

              sortedHours.forEach((hour: number) => {
                const hourDates = hourGroups.get(hour)!;
                const timeFormat = config.timeFormat || "24h";

                // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered en matchingRow
                const matchingRow = this._originalBody.find((row: any) => {
                  const cellValue = this.getCellValueByPositionFiltered(
                    row,
                    columnIndex
                  );
                  if (!cellValue) return false;
                  const date = new Date(cellValue);
                  return (
                    !isNaN(date.getTime()) &&
                    date.getUTCFullYear() === year &&
                    date.getUTCMonth() === month &&
                    date.getUTCDate() === day &&
                    date.getUTCHours() === hour
                  );
                });

                // ✅ CORRECCIÓN: Usar getCellValueByPositionFiltered para obtener valueToUse
                const valueToUse = matchingRow
                  ? this.getCellValueByPositionFiltered(matchingRow, columnIndex)
                  : hourDates[0].toISOString();

                // CRÍTICO: Formatear el texto usando el valor original y timeFormat
                const dateForDisplay = new Date(valueToUse);
                let hourText: string;

                if (timeFormat === "12h") {
                  const hours = dateForDisplay.getUTCHours();
                  const minutes = dateForDisplay.getUTCMinutes();
                  const ampm = hours >= 12 ? "PM" : "AM";
                  const hour12 = hours % 12 || 12;
                  hourText = `${String(hour12).padStart(2, "0")}:${String(
                    minutes
                  ).padStart(2, "0")} ${ampm}`;
                } else {
                  const hours = dateForDisplay.getUTCHours();
                  const minutes = dateForDisplay.getUTCMinutes();
                  hourText = `${String(hours).padStart(2, "0")}:${String(
                    minutes
                  ).padStart(2, "0")}`;
                }

                const hourId = `${columnIndex}-hour-${year}-${month}-${day}-${hour}`;
                const hourCount = countRowsForHour(year, month, day, hour);

                dayOption.children.push({
                  text: hourText,
                  value: valueToUse,
                  count: hourCount,
                  isParameter: false,
                  level: 3,
                  id: hourId,
                });
              });
            }
          });
        }
      });
    }
  });

  return options;
}

  //  NUEVO: Normalizar datetime completo (para filtros de hora)
  private normalizeDateTimeToISO(value: any): string {
    if (!value) return "";

    const str = String(value);

    // Si ya es un ISO string con hora
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
      // Normalizar: remover milisegundos y timezone para comparar solo hasta minutos
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        // Formato: YYYY-MM-DDTHH:mm
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    return "";
  }

  


  private applyHeaderFilters(): void {
 
  this.applyFiltersAndSorting();
}
  private flattenHierarchy(
    options: any[],
    parentExpanded: boolean = true
  ): any[] {
    const flattened: any[] = [];

    options.forEach((option: any) => {
      // Siempre agregar la opción actual
      flattened.push(option);

      // console.log("🔍 flattenHierarchy - Processing:", {
      //   text: option.text,
      //   expandable: option.expandable,
      //   expanded: option.expanded,
      //   hasChildren: option.children?.length,
      //   parentExpanded: parentExpanded,
      //   willShowChildren:
      //     option.children &&
      //     option.children.length > 0 &&
      //     option.expanded &&
      //     parentExpanded,
      // });

      //  FIX: Si tiene hijos Y está expandida Y el padre está expandido
      if (
        option.children &&
        option.children.length > 0 &&
        option.expanded &&
        parentExpanded
      ) {
        
        // Recursivamente aplanar los hijos
        const childrenFlattened = this.flattenHierarchy(option.children, true);
      
       
        flattened.push(...childrenFlattened);
      }
    });

    //console.log("🔍 flattenHierarchy result: " + flattened.length + " items");
    return flattened;
  }

  private showHeaderFilterMenu(columnIndex: number, icon: HTMLElement): void {
  const container = this.shadowRoot!.querySelector(".gridie-container") as HTMLElement;
  if (!container) return;

  const headers = this.headers;

  if (!headers || columnIndex >= headers.length) {
    console.error("Header index out of bounds:", columnIndex, "headers:", headers);
    return;
  }

  if (!this._originalBody || this._originalBody.length === 0) {
    console.error("No data available");
    return;
  }

  const header = headers[columnIndex];
  const headerFilterConfig = header.filters?.headerFilter;
  if (!headerFilterConfig || !headerFilterConfig.visible) return;

  const selectedValues = this._headerFilterSelections.get(columnIndex) || new Set<any>();

  // Generar opciones
  let allOptions: any[] = [];

  // 1. Parameters (si existen)
  if (headerFilterConfig.parameters) {
    allOptions = allOptions.concat(
      headerFilterConfig.parameters.map((param: HeaderFilterParameter) => {
        const count = this.countMatchingRows(columnIndex, param);
        return {
          text: param.text,
          value: param,
          count: count,
          isParameter: true,
        };
      })
    );
  }

  // 2. Jerarquía de fechas (si existe)
  if (headerFilterConfig.dateHierarchy && header.type === "date") {
    const uniqueValues = this.extractUniqueValues(columnIndex);
    const dateOptions = this.generateDateHierarchy(columnIndex, uniqueValues, headerFilterConfig);
    allOptions = allOptions.concat(dateOptions);
  }
  // 3. Values predefinidos (si existen y NO hay jerarquía de fechas)
  else if (headerFilterConfig.values) {
    allOptions = allOptions.concat(
      headerFilterConfig.values.map((val: any) => {
        const count = this._originalBody.filter(
          (row: any) => this.getCellValueByPosition(row, columnIndex) === val
        ).length;
        return { text: String(val), value: val, count, isParameter: false };
      })
    );
  }
  // 4. Valores únicos automáticos (si NO hay values ni jerarquía)
  else if (!headerFilterConfig.dateHierarchy) {
    const uniqueValues = this.extractUniqueValues(columnIndex);
    allOptions = allOptions.concat(
      Array.from(uniqueValues).map((val: any) => {
        const displayValue = this.formatCellValue(val, header);
        const count = this._originalBody.filter(
          (row: any) => this.getCellValueByPosition(row, columnIndex) === val
        ).length;
        return {
          text: displayValue,
          value: val,
          count: headerFilterConfig.showCount !== false ? count : null,
          isParameter: false,
        };
      })
    );
  }

  // Filtrar opciones según búsqueda
  let filteredOptions = allOptions;
  const searchTerm = (this._headerFilterSearchValues.get(columnIndex) || "").toLowerCase();
  if (searchTerm) {
    filteredOptions = allOptions.filter((opt: any) =>
      this.normalizeStringForSearch(opt.text).includes(this.normalizeStringForSearch(searchTerm))
    );
  }

  // Aplanar jerarquía si existe
  const hasHierarchy = allOptions.some((opt: any) => opt.expandable);

  if (hasHierarchy) {
    filteredOptions = this.flattenHierarchy(filteredOptions);
  }

  const showSelectAll = !hasHierarchy;

  // Calcular estados de checkboxes
  const selectableOptions = filteredOptions.filter((opt: any) => !opt.expandable);
  const allSelected =
    selectableOptions.length > 0 &&
    selectableOptions.every((opt: any) => {
      if (opt.isParameter) {
        return Array.from(selectedValues).some(
          (val: any) =>
            typeof val === "object" &&
            val.operator === opt.value.operator &&
            JSON.stringify(val) === JSON.stringify(opt.value)
        );
      }
      return selectedValues.has(opt.value);
    });

  const someSelected = selectableOptions.some((opt: any) => {
    if (opt.isParameter) {
      return Array.from(selectedValues).some(
        (val: any) =>
          typeof val === "object" &&
          val.operator === opt.value.operator &&
          JSON.stringify(val) === JSON.stringify(opt.value)
      );
    }
    return selectedValues.has(opt.value);
  });

  // Crear menú
  const menu = document.createElement("div");
  menu.className = "header-filter-menu";
  menu.dataset.columnIndex = String(columnIndex);

  // ✅ CAMBIO: position: absolute (se mueve con scroll vertical)
  const containerRect = container.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();
  
  const x = iconRect.left - containerRect.left + container.scrollLeft;
  const y = iconRect.bottom - containerRect.top + container.scrollTop + 4;


  menu.style.position = "absolute";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.zIndex = "10000";

  let menuHTML = "";

  // Campo de búsqueda (si está habilitado)
  if (headerFilterConfig.search) {
    const searchValue = this._headerFilterSearchValues.get(columnIndex) || "";
    menuHTML += `
    <div class="header-filter-search">
      <input 
        type="text" 
        placeholder="Buscar..." 
        data-search-column="${columnIndex}"
        value="${searchValue}"
      />
    </div>
  `;
  }

  // Checkbox "Seleccionar todos" (solo si no hay jerarquía)
  if (showSelectAll) {
    menuHTML += `
    <div class="header-filter-option header-filter-select-all" data-action="select-all">
      <input 
        type="checkbox" 
        ${allSelected ? "checked" : ""} 
        ${someSelected && !allSelected ? "data-indeterminate='true'" : ""}
      />
      <span>Seleccionar todos</span>
    </div>
    ${
      headerFilterConfig.parameters && allOptions.some((opt: any) => !opt.isParameter)
        ? '<div class="header-filter-separator"></div>'
        : ""
    }
  `;
  }

  // Renderizar cada opción con su índice correcto
  filteredOptions.forEach((option: any, optIndex: number) => {
    // Skip separators
    if (option.separator) {
      menuHTML += `<div class="header-filter-separator"></div>`;
      return;
    }

    const isSelected = (() => {
      if (option.expandable) return false;

      if (option.isParameter) {
        return Array.from(selectedValues).some((val: any) => {
          if (typeof val !== "object" || !val.operator) return false;
          
          if (val.operator !== option.value.operator) return false;
          
          if (Array.isArray(val.value) && Array.isArray(option.value.value)) {
            if (val.value.length !== option.value.value.length) return false;
            return val.value.every((v: any) => option.value.value.includes(v));
          }
          
          if (val.value !== option.value.value) return false;
          if (val.value2 !== option.value.value2) return false;
          
          return true;
        });
      }
      return selectedValues.has(option.value);
    })();

    const level = option.level || 0;
    const indent = level * 16;

    if (option.expandable) {
      const expandIcon = option.expanded ? "collapse-icon" : "expand-icon";

      menuHTML += `
    <div class="header-filter-option-parent" 
         data-option-index="${optIndex}" 
         data-option-id="${option.id || ""}"
         style="padding-left: ${indent + 12}px;">
      <span class="header-filter-expand-icon">${getFilterIcon(expandIcon)}</span>
      <span>${option.text}${
        option.count !== null && option.count !== undefined ? ` (${option.count})` : ""
      }</span>
    </div>
  `;
    } else {
      menuHTML += `
    <div class="header-filter-option" 
         data-option-index="${optIndex}"
         style="padding-left: ${indent + 12}px;">
      <input type="checkbox" ${isSelected ? "checked" : ""} />
      <span>${option.text}${
        option.count !== null && option.count !== undefined ? ` (${option.count})` : ""
      }</span>
    </div>
  `;
    }
  });

  menu.innerHTML = menuHTML;

  if (showSelectAll) {
    setTimeout(() => {
      const selectAllCheckbox = menu.querySelector(
        '.header-filter-select-all input[type="checkbox"]'
      ) as HTMLInputElement;
      if (selectAllCheckbox && selectAllCheckbox.dataset.indeterminate === "true") {
        selectAllCheckbox.indeterminate = true;
      }
    }, 0);
  }

  this._headerFilterMenu = menu;
  container.appendChild(menu);

  // ✅ Ajustar si se sale del viewport
  requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let adjustedX = x;
    let adjustedY = y;

    // Si se sale por la derecha
    if (menuRect.right > containerRect.right) {
      adjustedX = containerRect.width - menuRect.width - 10 + container.scrollLeft;
    }

    // Si se sale por la izquierda
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // Si se sale por abajo → posicionar ARRIBA del icono
    if (menuRect.bottom > containerRect.bottom) {
      adjustedY = iconRect.top - containerRect.top + container.scrollTop - menuRect.height - 4;
    }

    // Si también se sale por arriba, usar la mejor opción con scroll interno
    if (adjustedY < 10) {
      adjustedY = iconRect.bottom - containerRect.top + container.scrollTop + 4;
      const maxHeight = containerRect.bottom - iconRect.bottom - 20;
      menu.style.maxHeight = `${maxHeight}px`;
      menu.style.overflowY = "auto";
    }

    // Aplicar ajustes
    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  });

  this.attachHeaderFilterMenuEvents(columnIndex, filteredOptions, allOptions, hasHierarchy);
}
  
  private normalizeStringForSearch(str: string): string {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // Adjuntar eventos al menú del Header Filter
  // Adjuntar eventos al menú del Header Filter
private attachHeaderFilterMenuEvents(
  columnIndex: number,
  filteredOptions: any[],
  allOptions: any[],
  hasHierarchy: boolean
): void {
  const menu = this._headerFilterMenu;
  if (!menu) return;

  //  CRÍTICO: Prevenir que clics dentro del menú lo cierren
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Evento: Campo de búsqueda
  const searchInput = menu.querySelector(
    "input[data-search-column]"
  ) as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      e.stopPropagation();
      const value = (e.target as HTMLInputElement).value;
      this._headerFilterSearchValues.set(columnIndex, value);

      const scrollTop = menu.scrollTop;
      this.reopenHeaderFilterMenu(columnIndex);

      setTimeout(() => {
        if (this._headerFilterMenu) {
          this._headerFilterMenu.scrollTop = scrollTop;
          const newSearchInput = this._headerFilterMenu.querySelector(
            "input[data-search-column]"
          ) as HTMLInputElement;
          if (newSearchInput) {
            newSearchInput.focus();
            newSearchInput.setSelectionRange(
              newSearchInput.value.length,
              newSearchInput.value.length
            );
          }
        }
      }, 0);
    });

    searchInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Evento: Seleccionar todos
  const selectAllOption = menu.querySelector(".header-filter-select-all");
  if (selectAllOption) {
    selectAllOption.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleHeaderFilterSelectAll(columnIndex, allOptions);
    });
  }

  //  Evento para expand/collapse de parents (jerarquías)
  const parentElements = menu.querySelectorAll(
    ".header-filter-option-parent"
  );

  parentElements.forEach((parent) => {
    const optionIndexStr = (parent as HTMLElement).dataset.optionIndex;
    
    if (!optionIndexStr) {
      console.error("❌ Parent element missing data-option-index attribute");
      return;
    }
    
    const optionIndex = parseInt(optionIndexStr);
    
    if (isNaN(optionIndex)) {
      console.error("❌ Invalid option index:", optionIndexStr);
      return;
    }

    const optionData = filteredOptions[optionIndex];

    if (!optionData) {
      console.error(`❌ No optionData at filteredOptions[${optionIndex}]`);
      return;
    }

    parent.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleHeaderFilterExpandToggle(columnIndex, optionData);
    });
  });

  //  CORRECCIÓN CRÍTICA: Excluir el "select-all" del selector
  // Cambiado de ".header-filter-option" a ".header-filter-option:not(.header-filter-select-all)"
  const selectableElements = menu.querySelectorAll(
    ".header-filter-option:not(.header-filter-select-all)"
  );

  selectableElements.forEach((option) => {
    const optionIndexStr = (option as HTMLElement).dataset.optionIndex;
    
    if (!optionIndexStr) {
      console.error("❌ Selectable element missing data-option-index attribute");
      //console.log("Element HTML:", (option as HTMLElement).outerHTML);
      return;
    }
    
    const optionIndex = parseInt(optionIndexStr);
    
    if (isNaN(optionIndex)) {
      console.error("❌ Invalid option index:", optionIndexStr);
      return;
    }

    const optionData = filteredOptions[optionIndex];

    if (!optionData) {
      console.error(`❌ No optionData at filteredOptions[${optionIndex}]`);
      return;
    }

    if (optionData.separator) {
      return;
    }

    option.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleHeaderFilterOptionClick(columnIndex, optionData);
    });
  });
}

  //  NUEVO: Manejar expand/collapse de jerarquías
  //  NUEVO: Manejar expand/collapse de jerarquías de fechas
  private handleHeaderFilterExpandToggle(
    columnIndex: number,
    optionData: any
  ): void {
    

    if (!optionData || !optionData.id) {
      console.error("❌ Option data missing or no ID:", optionData);
      return;
    }

    const currentState =
      this._headerFilterExpandedState.get(optionData.id) || false;
    const newState = !currentState;

   

    this._headerFilterExpandedState.set(optionData.id, newState);

  

    const scrollTop = this._headerFilterMenu?.scrollTop || 0;

    this.reopenHeaderFilterMenu(columnIndex);

    setTimeout(() => {
      if (this._headerFilterMenu) {
        this._headerFilterMenu.scrollTop = scrollTop;
      }
    }, 0);
  }
  // Manejar clic en "Seleccionar todos"
private handleHeaderFilterSelectAll(
  columnIndex: number,
  allOptions: any[]
): void {
  const selectedValues =
    this._headerFilterSelections.get(columnIndex) || new Set<any>();
  const selectableOptions = allOptions.filter(
    (opt: any) => !opt.separator && !opt.expandable
  );

  //  CORRECCIÓN: Verificar correctamente si todos están seleccionados
  const allSelected =
    selectableOptions.length > 0 &&
    selectableOptions.every((opt: any) => {
      if (opt.isParameter && typeof opt.value === "object") {
        const cleanParam = {
          operator: opt.value.operator,
          value: opt.value.value,
          ...(opt.value.value2 !== undefined && { value2: opt.value.value2 }),
          ...(opt.value.unit !== undefined && { unit: opt.value.unit }),
          ...(opt.value.year !== undefined && { year: opt.value.year }),
        };
        
        return Array.from(selectedValues).some((selected: any) => {
          if (typeof selected !== "object" || !selected.operator) return false;
          
          // Comparar operator
          if (selected.operator !== cleanParam.operator) return false;
          
          // Comparar value (puede ser array para "in")
          if (Array.isArray(selected.value) && Array.isArray(cleanParam.value)) {
            if (selected.value.length !== cleanParam.value.length) return false;
            return selected.value.every((v: any) => cleanParam.value.includes(v));
          }
          
          // Comparar valores simples
          if (selected.value !== cleanParam.value) return false;
          
          // Comparar value2 si existe
          if (selected.value2 !== cleanParam.value2) return false;
          
          return true;
        });
      }
      return selectedValues.has(opt.value);
    });

  if (allSelected) {
    // Deseleccionar todos
    this._headerFilterSelections.delete(columnIndex);
  } else {
    // Seleccionar todos
    const newSelection = new Set<any>();
    selectableOptions.forEach((opt: any) => {
      if (opt.isParameter && typeof opt.value === "object") {
        const cleanParam = {
          operator: opt.value.operator,
          value: opt.value.value,
          ...(opt.value.value2 !== undefined && { value2: opt.value.value2 }),
          ...(opt.value.unit !== undefined && { unit: opt.value.unit }),
          ...(opt.value.year !== undefined && { year: opt.value.year }),
        };
        newSelection.add(cleanParam);
      } else {
        newSelection.add(opt.value);
      }
    });
    this._headerFilterSelections.set(columnIndex, newSelection);
  }

  this.applyFiltersAndSorting();

  this.reopenHeaderFilterMenu(columnIndex);
}
  // Manejar clic en opción individual
private handleHeaderFilterOptionClick(
  columnIndex: number,
  optionData: any
): void {
  //console.log("=== handleHeaderFilterOptionClick ===");
  //console.log("columnIndex:", columnIndex);
  //console.log("optionData:", optionData);
  
  const selectedValues =
    this._headerFilterSelections.get(columnIndex) || new Set<any>();
  const newSelection = new Set(selectedValues);

  // Toggle selección
  if (optionData.isParameter) {
   // console.log("Es un parameter");
    
    const cleanParameter = {
      operator: optionData.value.operator,
      value: optionData.value.value,
      ...(optionData.value.value2 !== undefined && { value2: optionData.value.value2 }),
      ...(optionData.value.unit !== undefined && { unit: optionData.value.unit }),
      ...(optionData.value.year !== undefined && { year: optionData.value.year }),
    };
    
    //console.log("Clean parameter:", cleanParameter);
    
    const existingParam = Array.from(newSelection).find(
      (val: any) =>
        typeof val === "object" &&
        val.operator === cleanParameter.operator &&
        JSON.stringify(val) === JSON.stringify(cleanParameter)
    );

    if (existingParam) {
     // console.log("Removiendo parameter existente");
      newSelection.delete(existingParam);
    } else {
     // console.log("Agregando clean parameter:", cleanParameter);
      newSelection.add(cleanParameter);
    }
  } else {
    //console.log("Es un valor simple");
    if (newSelection.has(optionData.value)) {
      newSelection.delete(optionData.value);
    } else {
      newSelection.add(optionData.value);
    }
  }

 // console.log("Nueva selección:", Array.from(newSelection));
  this._headerFilterSelections.set(columnIndex, newSelection);

  //  NUEVO: Resetear a página 1 al filtrar
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
  }

  this.applyHeaderFilters();
  this.reopenHeaderFilterMenu(columnIndex);
}
  // Re-abrir el menú del Header Filter (mantener posición)
  private reopenHeaderFilterMenu(columnIndex: number): void {
    const icon = this.shadow.querySelector(
      `.header-filter-icon[data-header-filter-column="${columnIndex}"]`
    ) as HTMLElement;

    if (!icon) return;

    //  GUARDAR SCROLL antes de cerrar
    const scrollTop = this._headerFilterMenu?.scrollTop || 0;

    const container = this.shadow.querySelector(
      ".gridie-container"
    ) as HTMLElement;
    if (!container) return;

    // Cerrar menú actual
    if (this._headerFilterMenu) {
      if (container.contains(this._headerFilterMenu)) {
        container.removeChild(this._headerFilterMenu);
      }
      this._headerFilterMenu = null;
    }

    // Volver a abrir (solo pasa columnIndex e icon)
    this._activeHeaderFilterDropdown = columnIndex;
    this.showHeaderFilterMenu(columnIndex, icon);

    //  RESTAURAR SCROLL después de re-abrir
    setTimeout(() => {
      if (this._headerFilterMenu) {
        this._headerFilterMenu.scrollTop = scrollTop;
      }
    }, 0);
  }
  // Actualiza attachFilterEvents():...
  private attachFilterEvents(): void {
    // Dropdown triggers
    this.shadow
      .querySelectorAll(".filter-operator-trigger")
      .forEach((trigger) => {
        const columnIndex = parseInt(
          (trigger as HTMLElement).dataset.columnIndex!
        );
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleOperatorDropdown(columnIndex);
        });
      });

    // Dropdown options
    this.shadow
      .querySelectorAll(".filter-operator-option")
      .forEach((option) => {
        const columnIndex = parseInt(
          (option as HTMLElement).dataset.columnIndex!
        );
        const operator = (option as HTMLElement).dataset
          .operator as FilterOperator;

        option.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleOperatorSelect(columnIndex, operator);
        });
      });

    // Input change (text, number, date)
    this.shadow.querySelectorAll("input.filter-input").forEach((input) => {
      const columnIndex = parseInt((input as HTMLElement).dataset.columnIndex!);
      const isSecond = (input as HTMLElement).dataset.isSecond === "true";

      input.addEventListener("input", () => {
        this.handleFilterChange(columnIndex, isSecond);
      });
    });

    // Select change (boolean)
    this.shadow.querySelectorAll("select.filter-select").forEach((select) => {
      const columnIndex = parseInt(
        (select as HTMLElement).dataset.columnIndex!
      );
      const isSecond = (select as HTMLElement).dataset.isSecond === "true";

      select.addEventListener("change", () => {
        this.handleFilterChange(columnIndex, isSecond);
      });
    });

    // Clear buttons
    this.shadow.querySelectorAll("span.filter-clear").forEach((clearBtn) => {
      const columnIndex = parseInt(
        (clearBtn as HTMLElement).dataset.columnIndex!
      );
      const isSecond = (clearBtn as HTMLElement).dataset.isSecond === "true";

      clearBtn.addEventListener("click", () => {
        this.handleFilterClear(columnIndex, isSecond);
      });
    });
  }

  private getSortIndicator(columnIndex: number): string {
    const sortState = this._sortingManager.getColumnSort(columnIndex);
    if (!sortState) return "";

    const arrow = sortState.direction === "asc" ? "▲" : "▼";
    const order =
      this._sortingManager.getAllSorts().length > 1
        ? ` ${sortState.order}`
        : "";

    return `<span class="sort-indicator">${arrow}${order}</span>`;
  }

  // ============= FILTER ROW METHODS =============

  // private hasFilterRow(): boolean {
  //   return this.headers.some(
  //     (header) => header.filters?.filterRow?.visible === true
  //   );
  // }

  private hasFilterRow(): boolean {
  // console.log("🔍 ========== hasFilterRow START ==========");
  // console.log("   Total headers:", this.headers.length);
  
  const headersWithFilterRow = this.headers.filter((header, index) => {
    const hasFilter = header.filters?.filterRow?.visible === true;
    // console.log(`   Header ${index} (${header.label}):`, {
    //   filters: header.filters,
    //   filterRow: header.filters?.filterRow,
    //   visible: header.filters?.filterRow?.visible,
    //   result: hasFilter
    // });
    return hasFilter;
  });
  
  // console.log(`   ✅ Total con filterRow visible:`, headersWithFilterRow.length);
  // console.log(`   Headers con filterRow:`, headersWithFilterRow.map(h => h.label));
  // console.log("🔍 ========== hasFilterRow END ==========");
  
  return headersWithFilterRow.length > 0;
}

  private getDefaultOperators(type: string): FilterOperator[] {
    switch (type) {
      case "string":
        return [
          "contains",
          "notcontains",
          "startswith",
          "endswith",
          "equals",
          "notequal",
        ];
      case "number":
      case "date":
        return ["=", "<>", "<", ">", "<=", ">=", "between"];
      case "boolean":
        return ["=", "<>"];
      default:
        return [
          "contains",
          "notcontains",
          "startswith",
          "endswith",
          "equals",
          "notequal",
        ];
    }
  }

  // private getOperatorsForColumn(header: GridieHeaderConfig): FilterOperator[] {
  //   if (header.filters?.filterRow?.operators) {
  //     return [...header.filters.filterRow.operators]; // ← Crea una copia
  //   }
  //   return this.getDefaultOperators(header.type || "string");
  // }

  /**
 * Obtiene los operadores disponibles para una columna
 * PRIORIDAD:
 * 1. Operadores personalizados en header.filters.filterRow.operators
 * 2. Operadores por defecto según el tipo de dato
 * 
 * @param header - Configuración del header
 * @returns Array de operadores válidos
 */
private getOperatorsForColumn(header: GridieHeaderConfig): FilterOperator[] {
  // ✅ PASO 1: Intentar usar operadores personalizados
  if (header.filters?.filterRow?.operators) {
    const customOps = header.filters.filterRow.operators;
    
    // Validar que sea un array no vacío
    if (Array.isArray(customOps) && customOps.length > 0) {
      //console.log(`🎯 Usando operadores personalizados para "${header.label}":`, customOps);
      return [...customOps]; // Retornar copia
    }
    
    console.warn(` Operadores personalizados inválidos para "${header.label}", usando defaults`);
  }

  // ✅ PASO 2: Usar operadores por defecto según tipo
  const defaultOps = this.getDefaultOperators(header.type || "string");
  //console.log(`📋 Usando operadores por defecto para "${header.label}" (${header.type}):`, defaultOps);
  
  return defaultOps;
}
  // private renderFilterRow(): string {
  //   if (!this.hasFilterRow()) return "";

  //   const headers = this.headers;

  //   return `
  //   <tr class="filter-row">
  //     ${headers
  //       .map((header, index) => {
  //         if (!header.filters?.filterRow?.visible) {
  //           return `<td></td>`;
  //         }

  //         const operators = this.getOperatorsForColumn(header);
  //         const currentFilter = this._filteringManager.getColumnFilter(index);
  //         const currentOperator = this.getCurrentOperator(index);
  //         const currentValue = currentFilter?.value || "";
  //         const currentValue2 = currentFilter?.value2 || "";

  //         // Layout especial para "between"
  //         if (currentOperator === "between") {
  //           return `
  //           <td>
  //             <div class="filter-cell">
  //               <div class="filter-cell-row">
  //                 ${this.renderOperatorDropdown(
  //                   index,
  //                   operators,
  //                   currentOperator
  //                 )}
  //                 <div class="filter-between-container">
  //                   <div class="filter-between-row">
  //                     <span class="filter-between-label">${
  //                       this._lang.filtering.placeholders.betweenFrom
  //                     }</span>
  //                     ${this.renderFilterInput(
  //                       header,
  //                       index,
  //                       currentOperator,
  //                       currentValue,
  //                       false
  //                     )}
  //                   </div>
  //                   <div class="filter-between-row">
  //                     <span class="filter-between-label">${
  //                       this._lang.filtering.placeholders.betweenTo
  //                     }</span>
  //                     ${this.renderFilterInput(
  //                       header,
  //                       index,
  //                       currentOperator,
  //                       currentValue2,
  //                       true
  //                     )}
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  //           </td>
  //         `;
  //         }

  //         // Layout normal para otros operadores
  //         return `
  //         <td>
  //           <div class="filter-cell">
  //             <div class="filter-cell-row">
  //               ${this.renderOperatorDropdown(
  //                 index,
  //                 operators,
  //                 currentOperator
  //               )}
  //               ${this.renderFilterInput(
  //                 header,
  //                 index,
  //                 currentOperator,
  //                 currentValue,
  //                 false
  //               )}
  //             </div>
  //           </div>
  //         </td>
  //       `;
  //       })
  //       .join("")}
  //   </tr>
  // `;
  // }

  private renderFilterRow(): string {
  // console.log("🔍 ========== renderFilterRow DEBUG ==========");
  
  if (!this.hasFilterRow()) {
    console.log("   ❌ hasFilterRow() retornó false");
    return "";
  }

  const headers = this.headers;
  // console.log("   📋 Headers normalizados:", headers.map(h => ({
  //   label: h.label,
  //   filterRow: h.filters?.filterRow,
  //   operators: h.filters?.filterRow?.operators
  // })));

  
  if (!this.hasFilterRow()) {
    //console.log("   ❌ Retornando vacío (hasFilterRow = false)");
    return "";
  }

  //console.log("   Headers a procesar:", headers.length);

  const filterRowHTML = `
    <tr class="filter-row">
      ${headers
        .map((header, index) => {
          // console.log(`   📋 Procesando header ${index} (${header.label}):`, {
          //   visible: header.filters?.filterRow?.visible,
          //   hasFilters: !!header.filters,
          //   hasFilterRow: !!header.filters?.filterRow
          // });

          if (!header.filters?.filterRow?.visible) {
            //console.log(`       ${header.label}: filterRow NO visible`);
            return `<td></td>`;
          }

          //console.log(`      ✅ ${header.label}: filterRow SÍ visible`);

          const operators = this.getOperatorsForColumn(header);
          const currentFilter = this._filteringManager.getColumnFilter(index);
          const currentOperator = this.getCurrentOperator(index);
          const currentValue = currentFilter?.value || "";
          const currentValue2 = currentFilter?.value2 || "";

          //console.log(`      Operadores:`, operators);
          //console.log(`      Current operator:`, currentOperator);

          // Layout especial para "between"
          if (currentOperator === "between") {
            return `
            <td>
              <div class="filter-cell">
                <div class="filter-cell-row">
                  ${this.renderOperatorDropdown(index, operators, currentOperator)}
                  <div class="filter-between-container">
                    <div class="filter-between-row">
                      <span class="filter-between-label">${this._lang.filtering.placeholders.betweenFrom}</span>
                      ${this.renderFilterInput(header, index, currentOperator, currentValue, false)}
                    </div>
                    <div class="filter-between-row">
                      <span class="filter-between-label">${this._lang.filtering.placeholders.betweenTo}</span>
                      ${this.renderFilterInput(header, index, currentOperator, currentValue2, true)}
                    </div>
                  </div>
                </div>
              </div>
            </td>
          `;
          }

          // Layout normal para otros operadores
          return `
          <td>
            <div class="filter-cell">
              <div class="filter-cell-row">
                ${this.renderOperatorDropdown(index, operators, currentOperator)}
                ${this.renderFilterInput(header, index, currentOperator, currentValue, false)}
              </div>
            </div>
          </td>
        `;
        })
        .join("")}
    </tr>
  `;

  //console.log("   📏 HTML generado (longitud):", filterRowHTML.length);
  //console.log("   📄 HTML preview:", filterRowHTML.substring(0, 200) + "...");
  //console.log("🔍 ========== renderFilterRow END ==========");

  return filterRowHTML;
}
private renderOperatorDropdown(
  columnIndex: number,
  operators: FilterOperator[],
  currentOperator: FilterOperator
): string {
  const isActive = this._activeOperatorDropdown === columnIndex;

  return `
    <div class="filter-operator-dropdown" data-column-index="${columnIndex}">
      <div class="filter-operator-trigger ${isActive ? "active" : ""}" 
           data-column-index="${columnIndex}">
        <span class="filter-operator-icon">${getFilterIcon(currentOperator)}</span>
      </div>
      
      <!-- ✅ Menú INLINE (no creado con document.createElement) -->
      <div class="filter-operator-menu ${isActive ? "active" : ""}" 
           data-column-index="${columnIndex}">
        ${operators.map(op => `
          <div class="filter-operator-option ${op === currentOperator ? "selected" : ""}" 
               data-operator="${op}"
               data-column-index="${columnIndex}">
            <span class="filter-operator-icon">${getFilterIcon(op)}</span>
            <span class="filter-operator-text">${this._lang.filtering.operators[op]}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

  private renderFilterInput(
    header: GridieHeaderConfig,
    columnIndex: number,
    operator: FilterOperator,
    value: any,
    isSecondInput: boolean
  ): string {
    const inputId = `filter-input-${columnIndex}${isSecondInput ? "-2" : ""}`;
    const hasValue = value !== null && value !== undefined && value !== "";

    if (header.type === "boolean") {
      return `
      <div class="filter-input-wrapper">
        <select 
          class="filter-select" 
          data-column-index="${columnIndex}"
          data-is-second="${isSecondInput}"
        >
          <option value="">${this._lang.filtering.placeholders.boolean}</option>
          <option value="true" ${
            value === true || value === "true" ? "selected" : ""
          }>
            ${this._lang.filtering.booleanOptions.true}
          </option>
          <option value="false" ${
            value === false || value === "false" ? "selected" : ""
          }>
            ${this._lang.filtering.booleanOptions.false}
          </option>
        </select>
        <span 
          class="filter-clear ${hasValue ? "visible" : ""}" 
          data-column-index="${columnIndex}"
          data-is-second="${isSecondInput}"
        >✕</span>
      </div>
    `;
    }

    let inputType = "text";
    let placeholder: string = this._lang.filtering.placeholders.string;
    let inputMode = "";

    switch (header.type) {
      case "number":
        inputType = "text"; // Cambiado de 'number' a 'text'
        inputMode = 'inputmode="decimal"'; // Sugerencia para teclado móvil
        placeholder = this._lang.filtering.placeholders.number;
        break;
      case "date":
        inputType = "date";
        placeholder = this._lang.filtering.placeholders.date;
        break;
    }

    return `
    <div class="filter-input-wrapper">
      <input 
        type="${inputType}"
        ${inputMode}
        class="filter-input"
        id="${inputId}"
        placeholder="${placeholder}"
        value="${value || ""}"
        data-column-index="${columnIndex}"
        data-is-second="${isSecondInput}"
        autocomplete="off"

      />
      <span 
        class="filter-clear ${hasValue ? "visible" : ""}" 
        data-column-index="${columnIndex}"
        data-is-second="${isSecondInput}"
      >✕</span>
    </div>
  `;
  }

private handleFilterChange(
  columnIndex: number,
  isSecondInput: boolean = false
): void {
  const header = this.headers[columnIndex];
  const operator = this.getCurrentOperator(columnIndex);

  let input: HTMLInputElement | HTMLSelectElement | null;

  if (header.type === "boolean") {
    input = this.shadow.querySelector(
      `select.filter-select[data-column-index="${columnIndex}"][data-is-second="${isSecondInput}"]`
    ) as HTMLSelectElement;
  } else {
    input = this.shadow.querySelector(
      `input.filter-input[data-column-index="${columnIndex}"][data-is-second="${isSecondInput}"]`
    ) as HTMLInputElement;
  }

  if (!input) return;
  const value = input.value;

  if (operator === "between") {
    const input1 = this.shadow.querySelector(
      `input.filter-input[data-column-index="${columnIndex}"][data-is-second="false"]`
    ) as HTMLInputElement;
    const input2 = this.shadow.querySelector(
      `input.filter-input[data-column-index="${columnIndex}"][data-is-second="true"]`
    ) as HTMLInputElement;

    if (input1 && input2) {
      const value1 = input1.value;
      const value2 = input2.value;

      if (value1 || value2) {
        this._filteringManager.addFilter(columnIndex, operator, value1, value2);
      } else {
        this._filteringManager.clearFilterValue(columnIndex);
      }
    }
  } else {
    if (value) {
      this._filteringManager.addFilter(columnIndex, operator, value);
    } else {
      this._filteringManager.clearFilterValue(columnIndex);
    }
  }

  //  ✅ Resetear a página 1 al filtrar
  if (this._config.paging?.enabled) {
    this._currentPage = 1;
  }

  this.applyFiltersAndSorting();
  this.restoreFocusAndScroll(input);
}

  private restoreFocusAndScroll(previousInput: HTMLElement): void {
    const container = this.shadow.querySelector(
      ".gridie-container"
    ) as HTMLElement;
    const scrollLeft = container?.scrollLeft || 0;
    const scrollTop = container?.scrollTop || 0;

    // Restaurar después del re-render
    setTimeout(() => {
      // Restaurar scroll
      if (container) {
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }

      // Restaurar foco
      const columnIndex = previousInput.dataset.columnIndex;
      const isSecond = previousInput.dataset.isSecond;

      if (columnIndex) {
        const selector = previousInput.classList.contains("filter-select")
          ? `select.filter-select[data-column-index="${columnIndex}"][data-is-second="${isSecond}"]`
          : `input.filter-input[data-column-index="${columnIndex}"][data-is-second="${isSecond}"]`;

        const newInput = this.shadow.querySelector(selector) as
          | HTMLInputElement
          | HTMLSelectElement;
        if (newInput) {
          newInput.focus();

          // Restaurar posición del cursor en inputs de texto
          if (
            newInput instanceof HTMLInputElement &&
            newInput.type === "text"
          ) {
            const cursorPos = newInput.value.length;
            newInput.setSelectionRange(cursorPos, cursorPos);
          }
        }
      }
    }, 0);
  }

  private handleFilterClear(
    columnIndex: number,
    isSecondInput: boolean = false
  ): void {
    const header = this.headers[columnIndex];

    // Guardar posición de scroll antes de limpiar
    const container = this.shadow.querySelector(
      ".gridie-container"
    ) as HTMLElement;
    const scrollLeft = container?.scrollLeft || 0;
    const scrollTop = container?.scrollTop || 0;

    if (header.type === "boolean") {
      const select = this.shadow.querySelector(
        `select.filter-select[data-column-index="${columnIndex}"][data-is-second="${isSecondInput}"]`
      ) as HTMLSelectElement;
      if (select) select.value = "";
    } else {
      const input = this.shadow.querySelector(
        `input.filter-input[data-column-index="${columnIndex}"][data-is-second="${isSecondInput}"]`
      ) as HTMLInputElement;
      if (input) input.value = "";
    }

    this.handleFilterChange(columnIndex, isSecondInput);

    setTimeout(() => {
      if (container) {
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    }, 0);
  }

  // ============= END FILTER ROW METHODS =============

  // ============= RENDERIZADO DE PAGINACIÓN =============

/**
 * Renderiza el footer de paginación completo
 */
private renderPaginationFooter(): string {
  if (!this._config.paging?.enabled) return '';
  
  const position = this._config.paging.position || 'bottom';
  
  if (position === 'both') {
    return `
      ${this.renderSingleFooter('top')}
      ${this.renderSingleFooter('bottom')}
    `;
  }
  
  return this.renderSingleFooter(position);
}

/**
 * Renderiza un footer individual (top o bottom)
 */
private renderSingleFooter(position: 'top' | 'bottom'): string {
  const config = this._config.paging!;
  const jumpToPosition = config.navigation?.jumpTo?.position || 'inline';
  
  const footerClass = jumpToPosition === 'below' 
    ? 'gridie-pagination-footer jumpto-below' 
    : 'gridie-pagination-footer';
  
  if (jumpToPosition === 'below') {
    return `
      <div class="${footerClass}" data-position="${position}">
        <div class="pagination-main">
          ${this.renderPageSizeSelector()}
          ${this.renderPaginationInfo()}
          <div class="pagination-right">
            ${this.renderNavigationButtons()}
          </div>
        </div>
        ${this.renderJumpToControl()}
      </div>
    `;
  }
  
  // Layout inline (default)
  return `
    <div class="${footerClass}" data-position="${position}">
      ${this.renderPageSizeSelector()}
      ${this.renderPaginationInfo()}
      <div class="pagination-right">
        ${this.renderNavigationButtons()}
        ${this.renderJumpToControl()}
      </div>
    </div>
  `;
}

/**
 * Renderiza el selector de tamaño de página
 */
private renderPageSizeSelector(): string {
  const config = this._config.paging?.pageSize;
  if (!config?.visible && config?.visible !== undefined) return '';
  
  const options = config?.options || [10, 25, 50, 100];
  const currentSize = this._pageSize;
  
  return `
    <div class="pagination-left">
      <select class="pagination-pagesize" data-action="pagesize-change">
        ${options.map(size => `
          <option value="${size}" ${size === currentSize ? 'selected' : ''}>
            ${size}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}


/**
 * Renderiza la información de registros (Mostrando X-Y de Z)
 */
private renderPaginationInfo(): string {
  // ✅ PROTECCIÓN: Si no hay config de paging o lang, retornar vacío
  if (!this._config.paging?.showInfo) return '';
  
  // ✅ PROTECCIÓN: Si no hay idioma configurado, usar valores por defecto
  if (!this._lang || !this._lang.paging) {
    console.warn(" Idioma de paginación no configurado, usando valores por defecto");
    
    if (this._totalItems === 0) {
      return `
        <div class="pagination-center">
          <span class="pagination-info">Mostrando 0 items</span>
        </div>
      `;
    }
    
    const start = (this._currentPage - 1) * this._pageSize + 1;
    const end = Math.min(this._currentPage * this._pageSize, this._totalItems);
    const total = this._totalItems;
    
    return `
      <div class="pagination-center">
        <span class="pagination-info">
          Mostrando ${start}-${end} de ${total.toLocaleString()} items
        </span>
      </div>
    `;
  }
  
  // ✅ CÓDIGO ORIGINAL (cuando el idioma está bien configurado)
  if (this._totalItems === 0) {
    return `
      <div class="pagination-center">
        <span class="pagination-info">
          ${this._lang.paging.showing} 0 ${this._lang.paging.items}
        </span>
      </div>
    `;
  }
  
  const start = (this._currentPage - 1) * this._pageSize + 1;
  const end = Math.min(this._currentPage * this._pageSize, this._totalItems);
  const total = this._totalItems;
  
  return `
    <div class="pagination-center">
      <span class="pagination-info">
        ${this._lang.paging.showing} ${start}-${end} ${this._lang.paging.of} ${total.toLocaleString()} ${this._lang.paging.items}
      </span>
    </div>
  `;
}

/**
 * Renderiza los botones de navegación
 */
private renderNavigationButtons(): string {
  const config = this._config.paging?.navigation;
  if (config?.visible === false) return '';
  
  const showFirstLast = config?.showFirstLast ?? true;
  const showPrevNext = config?.showPrevNext ?? true;
  
  const firstDisabled = this._currentPage === 1 ? 'disabled' : '';
  const lastDisabled = this._currentPage === this._totalPages ? 'disabled' : '';
  
  const pageButtons = this.calculatePageButtons();
  
  // ✅ PROTECCIÓN: Valores por defecto si no hay idioma
  const labels = {
    first: this._lang?.paging?.first || 'Primera',
    previous: this._lang?.paging?.previous || 'Anterior',
    next: this._lang?.paging?.next || 'Siguiente',
    last: this._lang?.paging?.last || 'Última',
  };
  
  return `
    <div class="pagination-navigation">
      ${showFirstLast ? `
        <button 
          class="pagination-btn pagination-first" 
          data-action="first-page"
          ${firstDisabled}
          title="${labels.first}"
        >
          &lt;&lt;
        </button>
      ` : ''}
      
      ${showPrevNext ? `
        <button 
          class="pagination-btn pagination-prev" 
          data-action="prev-page"
          ${firstDisabled}
          title="${labels.previous}"
        >
          &lt;
        </button>
      ` : ''}
      
      ${this.renderPageButtons(pageButtons)}
      
      ${showPrevNext ? `
        <button 
          class="pagination-btn pagination-next" 
          data-action="next-page"
          ${lastDisabled}
          title="${labels.next}"
        >
          &gt;
        </button>
      ` : ''}
      
      ${showFirstLast ? `
        <button 
          class="pagination-btn pagination-last" 
          data-action="last-page"
          ${lastDisabled}
          title="${labels.last}"
        >
          &gt;&gt;
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Renderiza los botones numéricos de página
 */
private renderPageButtons(buttons: (number | "ellipsis")[]): string {
  return buttons.map(btn => {
    if (btn === "ellipsis") {
      return `<span class="pagination-ellipsis">...</span>`;
    }
    
    const isActive = btn === this._currentPage;
    const activeClass = isActive ? 'active' : '';
    
    return `
      <button 
        class="pagination-btn pagination-page ${activeClass}" 
        data-action="goto-page"
        data-page="${btn}"
        ${isActive ? 'aria-current="page"' : ''}
      >
        ${btn}
      </button>
    `;
  }).join('');
}

/**
 * Renderiza el control "Ir a página"
 */
private renderJumpToControl(): string {
  const config = this._config.paging?.navigation?.jumpTo;
  if (!config?.visible) return '';
  
  const buttonText = config.buttonText || '→';
  
  // ✅ PROTECCIÓN: Valores por defecto si no hay idioma
  const jumpToLabel = this._lang?.paging?.jumpTo || 'Ir a';
  const pageLabel = this._lang?.paging?.page || 'Página';
  
  return `
    <div class="pagination-jumpto">
      <span class="jumpto-label">${jumpToLabel}:</span>
      <input 
        type="number" 
        class="jumpto-input" 
        data-action="jumpto-input"
        min="1" 
        max="${this._totalPages}" 
        placeholder="${pageLabel}"
        aria-label="${jumpToLabel} ${pageLabel}"
      />
      <button 
        class="jumpto-btn" 
        data-action="jumpto-btn"
        title="${jumpToLabel}"
      >
        ${buttonText}
      </button>
    </div>
  `;
}

/**
 * Adjunta eventos a los controles del footer de paginación
 */
/**
 * Adjunta eventos a los controles del footer de paginación
 */
private attachPaginationEvents(): void {
  if (!this._config.paging?.enabled) return;
  
  const footers = this.shadow.querySelectorAll('.gridie-pagination-footer');
  
  footers.forEach(footer => {
    // PageSize selector
    const pageSizeSelect = footer.querySelector('[data-action="pagesize-change"]');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        const newSize = parseInt((e.target as HTMLSelectElement).value);
        this.setPageSize(newSize);
      });
    }
    
    // First page button
    const firstBtn = footer.querySelector('[data-action="first-page"]');
    if (firstBtn) {
      firstBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.firstPage();
      });
    }
    
    // Previous page button
    const prevBtn = footer.querySelector('[data-action="prev-page"]');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.previousPage();
      });
    }
    
    // Next page button
    const nextBtn = footer.querySelector('[data-action="next-page"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.nextPage();
      });
    }
    
    // Last page button
    const lastBtn = footer.querySelector('[data-action="last-page"]');
    if (lastBtn) {
      lastBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.lastPage();
      });
    }
    
    // Page number buttons
    footer.querySelectorAll('[data-action="goto-page"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt((btn as HTMLElement).dataset.page!);
        this.goToPage(page);
      });
    });
    
    //  Jump to input (Enter key) - CORREGIDO
  //  SOLUCIÓN 1: Type Assertion (Recomendada)
const jumpToInput = footer.querySelector('[data-action="jumpto-input"]');
if (jumpToInput) {
  jumpToInput.addEventListener('keypress', ((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleJumpTo(footer);
    }
  }) as EventListener); // ← Type assertion
}
    
    // Jump to button
    const jumpToBtn = footer.querySelector('[data-action="jumpto-btn"]');
    if (jumpToBtn) {
      jumpToBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleJumpTo(footer);
      });
    }
  });
}

/**
 * Maneja el salto a página específica
 */
private handleJumpTo(footer: Element): void {
  const input = footer.querySelector('[data-action="jumpto-input"]') as HTMLInputElement;
  if (!input) return;
  
  const page = parseInt(input.value);
  
  if (isNaN(page) || page < 1 || page > this._totalPages) {
    // Mostrar error visual
    input.style.borderColor = '#e74c3c';
    input.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
    
    setTimeout(() => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    }, 1000);
    
    console.warn(`Página ${page} inválida. Rango: 1-${this._totalPages}`);
    return;
  }
  
  this.goToPage(page);
  input.value = ''; // Limpiar input
}

 render() {

   if (this._hasError) {
    this.renderErrorState();
    return;
  }

  //   console.log("🎨 ========== RENDER START ==========");
  // console.log("Headers:", this.headers);
  // console.log("hasFilterRow():", this.hasFilterRow());
  // console.log("Filter row HTML length:", this.renderFilterRow().length);



  const headers = this.headers;
  const body = this._config.paging?.enabled && this._config.mode === "client"
    ? this._pagedBody
    : this._body;
  const gridieId = this.gridieId;

  this._eventHandlers.clear();

  this.shadow.innerHTML = `
    <style>
      ${gridieStyles}
      ${filterRowStyles}
      ${paginationStyles}


      /* ✅ MENÚS CON POSITION FIXED */
.gridie-context-menu,
.header-filter-menu {
  position: fixed;
  z-index: 10000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: Arial, sans-serif;
}

.header-filter-menu {
  max-height: min(400px, 70vh);
  overflow-y: auto;
  min-width: 200px;
  padding: 4px 0;
}

.gridie-context-menu {
  min-width: 180px;
  padding: 4px 0;
}

/* El resto de estilos permanecen igual */
.header-filter-search {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.header-filter-search input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.header-filter-search input:focus {
  outline: none;
  border-color: #667eea;
}

.header-filter-select-all {
  font-weight: 600;
  border-bottom: 1px solid #eee;
  margin-bottom: 4px;
}

.header-filter-option {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  font-size: 14px;
}

.header-filter-option:hover {
  background-color: #f5f5f5;
}

.header-filter-option input[type="checkbox"] {
  cursor: pointer;
  margin: 0;
}

.header-filter-option span {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-filter-option-parent {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.header-filter-option-parent:hover {
  background-color: #f0f0f0;
}

.header-filter-expand-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-filter-expand-icon svg {
  width: 100%;
  height: 100%;
}

.header-filter-separator {
  height: 1px;
  background-color: #eee;
  margin: 4px 0;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  user-select: none;
  display: flex;
  gap: 10px;
}

.context-menu-item:hover {
  background: #f0f0f0;
}

.sort-icon {
  display: flex;
  width: 16px;
  height: 16px;
}

.context-menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}


      
/* ✅ CONTENEDOR: Contexto de posicionamiento */
.gridie-container {
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  font-family: Arial, sans-serif;
}

/* ✅ WRAPPER DE LA TABLA */
.gridie-table-wrapper {
  position: relative;
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
}

/* ✅ MENÚS: Todos posicionados absolute dentro del container */
.gridie-context-menu,
.header-filter-menu {
  position: absolute;
  z-index: 10000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 90vw; /* No más ancho que la ventana */
}

/* ✅ Header filter con max-height y scroll */
.header-filter-menu {
  max-height: min(400px, 70vh);
  overflow-y: auto;
  min-width: 200px;
  padding: 4px 0;
}

/* ✅ Context menu */
.gridie-context-menu {
  min-width: 180px;
  padding: 4px 0;
}

/* ✅ CRÍTICO: Evitar que el scroll del container afecte los menús */
.gridie-container:has(.gridie-context-menu),
.gridie-container:has(.header-filter-menu) {
  overflow: visible; /* Permitir que los menús salgan */
}


      .gridie-context-menu {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 200px;
  font-family: Arial, sans-serif;
  z-index: 10000;
}

.gridie-context-menu .context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.2s;
  user-select: none;
}

.gridie-context-menu .context-menu-item:hover {
  background: #f0f0f0;
}

.gridie-context-menu .context-menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

      /* ✅ NUEVO: Estilos para scroll independiente */
      .gridie-table-wrapper {
        overflow-x: auto;
        overflow-y: visible;
        width: 100%;
        margin-bottom: 0;
      }

      /* La tabla ahora está dentro del wrapper con scroll */
      .gridie-table-wrapper .gridie-table {
        margin-bottom: 0;
      }

      /* El footer queda fuera del scroll */
      .gridie-pagination-footer[data-position="bottom"] {
        margin-top: 0;
        border-top: 1px solid #ddd;
        background: white;
      }

      .gridie-pagination-footer[data-position="top"] {
        margin-bottom: 0;
        border-bottom: 1px solid #ddd;
        background: white;
      }

      /* Opcional: Sombra para indicar que hay scroll */
      .gridie-table-wrapper::-webkit-scrollbar {
        height: 8px;
      }

      .gridie-table-wrapper::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .gridie-table-wrapper::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .gridie-table-wrapper::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      .gridie-context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 180px;
        z-index: 1000;
        font-family: Arial, sans-serif;
        padding: 4px 0;
      }

      .context-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
        user-select: none;
        display:flex;
        gap:10px;
      }

      .sort-icon{
          display:flex;
          width: 16px;
          height: 16px;
      }

      .context-menu-item:hover {
        background: #f0f0f0;
      }

      .context-menu-divider {
        height: 1px;
        background: #e0e0e0;
        margin: 4px 0;
      }

      /* Estilos para dropdown de operadores */
      .filter-operator-menu {
         position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        max-height: 250px;
        overflow-y: auto;
        z-index: 1000;
        font-family: Arial, sans-serif;
        display: none;
        margin-top: 2px;
      }

      .filter-operator-menu.active {
        display: block;
      }

      .filter-operator-option {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 0.85em;
        transition: background 0.2s;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .filter-operator-option:hover {
        background: #f0f0f0;
      }

      .filter-operator-option.selected {
        background: #e8edff;
        color: #667eea;
      }

      .filter-operator-option .filter-operator-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: inherit;
      }

      .filter-operator-option .filter-operator-text {
        flex: 1;
      }

      /*  ESTILOS COMPLETOS DEL HEADER FILTER */
      .header-filter-menu {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        max-height: 300px;
        min-width: 200px;
        overflow-y: auto;
        z-index: 1000;
        padding: 4px 0;
        font-family: Arial, sans-serif;
      }

      .header-filter-search {
        padding: 8px;
        border-bottom: 1px solid #eee;
      }

      .header-filter-search input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .header-filter-search input:focus {
        outline: none;
        border-color: #667eea;
      }

      .header-filter-select-all {
        font-weight: 600;
        border-bottom: 1px solid #eee;
        margin-bottom: 4px;
      }

      .header-filter-option {
        padding: 6px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
        font-size: 14px;
      }

      .header-filter-option:hover {
        background-color: #f5f5f5;
      }

      .header-filter-option input[type="checkbox"] {
        cursor: pointer;
        margin: 0;
      }

      .header-filter-option span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /*  Estilos para opciones parent (expandibles) */
      .header-filter-option-parent {
        padding: 6px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }

      .header-filter-option-parent:hover {
        background-color: #f0f0f0;
      }

      .header-filter-expand-icon {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .header-filter-expand-icon svg {
        width: 100%;
        height: 100%;
      }

      .header-filter-separator {
        height: 1px;
        background-color: #eee;
        margin: 4px 0;
      }

      .header-filter-option-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .header-filter-option-count {
        color: #999;
        font-size: 0.9em;
        flex-shrink: 0;
      }

      /* Icono del header filter */
      .header-filter-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        cursor: pointer;
        color: #999;
        transition: color 0.2s;
      }

      .header-filter-icon:hover {
        color: #667eea;
      }

      .header-filter-icon.active {
        color: #667eea;
      }

      .header-filter-icon svg {
        width: 100%;
        height: 100%;
      }

      .content-th {
        display: flex;
      }

      .th-content {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 6px;
      }

      /* Para evitar saltos cuando no hay icono */
      .th-filter-icon,
      .th-sort-indicator {
        display: flex;
        align-items: center;
      }
    </style>

    <div class="gridie-container" data-gridie-id="${gridieId}">
      ${gridieId ? `<div class="gridie-id">ID: ${gridieId}</div>` : ""}
      
      ${this._config.paging?.position === 'top' || this._config.paging?.position === 'both' 
        ? this.renderPaginationFooter() 
        : ''}
      
      <!-- ✅ NUEVO: Wrapper con scroll solo para la tabla -->
      <div class="gridie-table-wrapper">
        <table class="gridie-table">
          <thead>
            <tr>
              ${headers
                .map(
                  (header, index) => `
               <th 
    class="${header.sortable ? "sortable" : ""}" 
    data-column-index="${index}"
  >
    <div class="th-content">

      <div class="th-filter-icon">
        ${this.renderHeaderFilterIcon(index, header)}
      </div>

      <div class="th-label">
        ${header.label}
      </div>

      <div class="th-sort-indicator">
        ${this.getSortIndicator(index)}
      </div>

    </div>
  </th>

              `
                )
                .join("")}
            </tr>
            ${this.renderFilterRow()}
          </thead>
          <tbody>
            ${
              body.length > 0
                ? body
                    .map(
                      (row, rowIndex) => `
                  <tr data-index="${rowIndex}">
                    ${headers
                      .map(
                        (header, colIndex) =>
                          `<td>${this.renderCell(
                            row,
                            header,
                            colIndex,
                            rowIndex
                          )}</td>`
                      )
                      .join("")}
                  </tr>
                `
                    )
                    .join("")
                : `<tr><td colspan="${headers.length}" class="no-data">${this._lang.table.noData}</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <!-- ✅ FIN del wrapper -->
      
      ${this._config.paging?.position === 'bottom' || this._config.paging?.position === 'both' 
        ? this.renderPaginationFooter() 
        : ''}
    </div>
  `;

  this.attachActionEvents();
  this.attachHeaderEvents();
  this.attachFilterEvents();
  this.attachHeaderFilterEvents();
  this.attachPaginationEvents();


}





  // Renderizar icono del Header Filter
  private renderHeaderFilterIcon(
    columnIndex: number,
    header: GridieHeaderConfig
  ): string {
    if (!header.filters?.headerFilter?.visible) return "";

    //  Verificar si hay filtros activos en esta columna
    const hasActiveFilter =
      this._headerFilterSelections.has(columnIndex) &&
      this._headerFilterSelections.get(columnIndex)!.size > 0;

    const iconClass = hasActiveFilter
      ? "header-filter-icon active"
      : "header-filter-icon";
    const iconKey = hasActiveFilter ? "filter-active" : "filter-header";

    return `
    <span 
      class="${iconClass}" 
      data-header-filter-column="${columnIndex}"
      title="${hasActiveFilter ? "Filtros activos" : "Filtrar"}"
    >
      ${getFilterIcon(iconKey)}
      ${hasActiveFilter ? '<span class="header-filter-badge"></span>' : ""}
    </span>
  `;
  }
  // Adjuntar eventos a los iconos de Header Filter
  private attachHeaderFilterEvents(): void {
    // Remover listeners anteriores clonando nodos
    this.shadow.querySelectorAll(".header-filter-icon").forEach((icon) => {
      const clone = icon.cloneNode(true);
      icon.parentNode?.replaceChild(clone, icon);
    });

    // Agregar nuevos listeners
    this.shadow.querySelectorAll(".header-filter-icon").forEach((icon) => {
      const columnIndex = parseInt(
        (icon as HTMLElement).dataset.headerFilterColumn!
      );

      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.toggleHeaderFilterDropdown(columnIndex);
      });
    });
  }

  // Toggle Header Filter dropdown
  private toggleHeaderFilterDropdown(columnIndex: number): void {
    if (this._activeHeaderFilterDropdown === columnIndex) {
      this.closeHeaderFilterDropdown();
    } else {
      this.openHeaderFilterDropdown(columnIndex);
    }
  }

  // Abrir Header Filter dropdown
  private openHeaderFilterDropdown(columnIndex: number): void {
    this.closeHeaderFilterDropdown();

    this._activeHeaderFilterDropdown = columnIndex;

    const icon = this.shadow.querySelector(
      `.header-filter-icon[data-header-filter-column="${columnIndex}"]`
    ) as HTMLElement;

    if (!icon) return;

    //  Llamar a showHeaderFilterMenu solo con columnIndex e icon
    this.showHeaderFilterMenu(columnIndex, icon);
  }

  // Cerrar Header Filter dropdown
  private closeHeaderFilterDropdown(): void {
    if (this._activeHeaderFilterDropdown === null) return;

    if (this._headerFilterMenu) {
      //  Remover del shadow DOM en lugar de document.body
      const container = this.shadow.querySelector(
        ".gridie-container"
      ) as HTMLElement;
      if (container && container.contains(this._headerFilterMenu)) {
        container.removeChild(this._headerFilterMenu);
      }
      this._headerFilterMenu = null;
    }

    this._activeHeaderFilterDropdown = null;
  }

  private attachHeaderEvents(): void {
    this.shadow.querySelectorAll("th[data-column-index]").forEach((th) => {
      const columnIndex = parseInt((th as HTMLElement).dataset.columnIndex!);

      th.addEventListener("click", () => {
        this.handleHeaderClick(columnIndex);
      });

      th.addEventListener("contextmenu", (e) => {
        this.handleHeaderRightClick(e as MouseEvent, columnIndex);
      });
    });
  }

  private attachActionEvents(): void {
    this._eventHandlers.forEach((action, actionId) => {
      const element = this.shadow.querySelector(
        `[data-action-id="${actionId}"]`
      );

      if (element) {
        const parts = actionId.split("-");
        const rowIndex = parseInt(parts[1]);
        const rowData = this.body[rowIndex];

        element.addEventListener(action.event, (e) => {
          e.stopPropagation();
          action.funct(rowData, rowIndex);
        });
      }
    });
  }
}

customElements.define("gridie-table", Gridie);
