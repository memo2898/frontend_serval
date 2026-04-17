// src/gridie/assets/icons/filters/index.ts

// src/gridie/
// ├── assets/
// │   └── icons/
// │       └── filters/
// │           ├── contains.svg
// │           ├── notcontains.svg
// │           ├── startswith.svg
// │           ├── endswith.svg
// │           ├── equals.svg
// │           ├── notequal.svg

// │           ├── equal.svg
// │           ├── notequal-number.svg
// │           ├── lessthan.svg lista
// │           ├── greaterthan.svg


// │           ├── lessequal.svg
// │           ├── greaterequal.svg
// │           └── between.svg



//Nuevos iconos:


// search-icon.svg - Lupa para el campo de búsqueda 🔍: Listo

// expand-icon.svg - Flecha derecha ▶ (para nodos colapsados): Listo
// collapse-icon.svg - Flecha abajo ▼ (para nodos expandidos)

// checkbox-unchecked.svg - Checkbox vacío ☐ : Listo
// checkbox-checked.svg - Checkbox seleccionado ☑ : LISTO
// checkbox-indeterminate.svg - Checkbox intermedio ◫ :lISTO
// filter-active.svg - Embudo con indicador de filtro activo (opcional) : LISTO
// filter-header.svg - Icono del embudo para el encabezado 🔽 : lISTO

export const filterIcons: Record<string, string> = {
  // String operators
  contains: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.6 15.96">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M6.42,8.65V13.1H5.15v-1a2.74,2.74,0,0,1-2.42,1.06C1.06,13.19,0,12.29,0,11S.77,8.86,3,8.86H5.08V8.59c0-1.12-.65-1.78-2-1.78A3.76,3.76,0,0,0,.77,7.6l-.56-1a4.9,4.9,0,0,1,3.05-.94C5.27,5.66,6.42,6.63,6.42,8.65Zm-1.34,2.2v-1H3c-1.32,0-1.7.51-1.7,1.14s.61,1.2,1.63,1.2A2.14,2.14,0,0,0,5.08,10.85Z"
      />
      <path
        class="cls-1"
        d="M17.7,9.35A3.68,3.68,0,0,1,21.6,5.6a3.27,3.27,0,0,1,3,1.57l-1,.65a2.31,2.31,0,0,0-2-1.06,2.45,2.45,0,0,0-2.53,2.59A2.45,2.45,0,0,0,21.58,12a2.31,2.31,0,0,0,2-1.06l1,.64a3.28,3.28,0,0,1-3,1.58A3.7,3.7,0,0,1,17.7,9.35Z"
      />
      <path
        class="cls-1"
        d="M7.44,0V16H17V0Zm4.87,13.18a3.14,3.14,0,0,1-2.63-1.25V13.1H8.4V2.77H9.74V6.84a3.12,3.12,0,0,1,2.57-1.19A3.58,3.58,0,0,1,16,9.41,3.59,3.59,0,0,1,12.31,13.18Z"
      />
      <path
        class="cls-1"
        d="M12.2,6.82A2.43,2.43,0,0,0,9.73,9.41a2.48,2.48,0,1,0,5,0A2.43,2.43,0,0,0,12.2,6.82Z"
      />
    </g>
  </g>
</svg>
`,
  
  notcontains: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.71 15.96">
  <defs>
    <style>
      .cls-1 {
        fill: #010201;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M0,0V7.71H5.13V7.56c0-1.13-.65-1.78-2-1.78a3.71,3.71,0,0,0-2.34.79l-.56-1a5,5,0,0,1,3.05-1c2,0,3.16,1,3.16,3v.09H9v-6h1.33V5.81a3.14,3.14,0,0,1,2.58-1.19,3.55,3.55,0,0,1,3.67,3.09h1.29a3.68,3.68,0,0,1,3.83-3.09,3.31,3.31,0,0,1,3,1.58l-1,.65a2.3,2.3,0,0,0-2-1.06,2.4,2.4,0,0,0-2.45,1.92h5.52V0Z"
      />
      <path
        class="cls-1"
        d="M12.75,5.79a2.37,2.37,0,0,0-2.4,1.92h4.81A2.38,2.38,0,0,0,12.75,5.79Z"
      />
      <path
        class="cls-1"
        d="M0,8.78V16H24.71V8.78H0Zm19.14,0a2.41,2.41,0,0,0,2.5,2.2,2.29,2.29,0,0,0,2-1.05l1,.64a3.31,3.31,0,0,1-3,1.58,3.68,3.68,0,0,1-3.86-3.37ZM9,8.78H10.3a2.46,2.46,0,0,0,4.9,0h1.35a3.55,3.55,0,0,1-3.69,3.37,3.12,3.12,0,0,1-2.63-1.25v1.17H9Zm-8.54,0H3.07c-1.32,0-1.69.52-1.69,1.15S2,11.12,3,11.12A2.13,2.13,0,0,0,5.13,9.81v-1H6.47v3.29H5.2v-1a2.72,2.72,0,0,1-2.42,1.06C1.11,12.15.05,11.26.05,10A2,2,0,0,1,.41,8.78Z"
      />
    </g>
  </g>
</svg>
`,
  
  startswith: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.66 15.96">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M1.38,9.93c0,.73.61,1.19,1.62,1.19A2.13,2.13,0,0,0,5.13,9.81v-1H3.07C1.75,8.78,1.38,9.3,1.38,9.93Z"
      />
      <path
        class="cls-1"
        d="M12.75,5.79a2.43,2.43,0,0,0-2.48,2.59,2.49,2.49,0,1,0,5,0A2.43,2.43,0,0,0,12.75,5.79Z"
      />
      <path
        class="cls-1"
        d="M0,0V16H16.59V8.38a3.59,3.59,0,0,1-3.73,3.77,3.12,3.12,0,0,1-2.63-1.25v1.17H9V1.74h1.33V5.81a3.14,3.14,0,0,1,2.58-1.19,3.59,3.59,0,0,1,3.73,3.76V0ZM6.47,12.07H5.2v-1a2.72,2.72,0,0,1-2.42,1.06C1.11,12.15.05,11.26.05,10S.82,7.82,3,7.82H5.13V7.56c0-1.13-.65-1.78-2-1.78a3.71,3.71,0,0,0-2.34.79l-.56-1a5,5,0,0,1,3.05-1c2,0,3.16,1,3.16,3Z"
      />
      <path
        class="cls-1"
        d="M17.76,8.38a3.68,3.68,0,0,1,3.89-3.76,3.31,3.31,0,0,1,3,1.58l-1,.65a2.3,2.3,0,0,0-2-1.06,2.45,2.45,0,0,0-2.53,2.59A2.44,2.44,0,0,0,21.64,11a2.29,2.29,0,0,0,2-1.05l1,.64a3.31,3.31,0,0,1-3,1.58A3.69,3.69,0,0,1,17.76,8.38Z"
      />
    </g>
  </g>
</svg>
`,
  
  endswith: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.66 15.96">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M6.42,7.62v4.45H5.15v-1a2.74,2.74,0,0,1-2.42,1.06C1.06,12.15,0,11.26,0,10S.77,7.82,3,7.82H5.08V7.56c0-1.13-.65-1.78-2-1.78a3.7,3.7,0,0,0-2.33.79l-.56-1a4.91,4.91,0,0,1,3.05-1C5.27,4.62,6.42,5.6,6.42,7.62ZM5.08,9.81v-1H3c-1.32,0-1.7.52-1.7,1.15S1.93,11.12,3,11.12A2.14,2.14,0,0,0,5.08,9.81Z"
      />
      <path
        class="cls-1"
        d="M12.69,5.79a2.44,2.44,0,0,0-2.48,2.59,2.49,2.49,0,1,0,5,0A2.43,2.43,0,0,0,12.69,5.79Z"
      />
      <path
        class="cls-1"
        d="M8.28,0V16H24.66V0ZM12.8,12.15a3.14,3.14,0,0,1-2.63-1.25v1.17H8.89V1.74h1.34V5.81A3.12,3.12,0,0,1,12.8,4.62a3.58,3.58,0,0,1,3.73,3.76A3.59,3.59,0,0,1,12.8,12.15ZM21.58,11a2.3,2.3,0,0,0,2-1.05l1,.64a3.28,3.28,0,0,1-3,1.58,3.7,3.7,0,0,1-3.9-3.77,3.69,3.69,0,0,1,3.9-3.76,3.28,3.28,0,0,1,3,1.58l-1,.65a2.31,2.31,0,0,0-2-1.06,2.45,2.45,0,0,0-2.53,2.59A2.44,2.44,0,0,0,21.58,11Z"
      />
    </g>
  </g>
</svg>
`,
  
  equals: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.84 4.93">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <rect class="cls-1" width="17.84" height="1.41" />
      <rect class="cls-1" y="3.52" width="17.84" height="1.41" />
    </g>
  </g>
</svg>
`,
  
  notequal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.84 17.18">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <polygon
        class="cls-1"
        points="17.84 7.24 17.84 5.83 10.89 5.83 14.26 0 12.6 0.05 9.27 5.83 0 5.83 0 7.24 8.45 7.24 7.24 9.35 0 9.35 0 10.76 6.42 10.76 2.71 17.18 4.34 17.18 8.05 10.76 17.84 10.76 17.84 9.35 8.86 9.35 10.08 7.24 17.84 7.24"
      />
    </g>
  </g>
</svg>
`,
  
  // Number/Date operators
  '=': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.84 4.93">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <rect class="cls-1" width="17.84" height="1.41" />
      <rect class="cls-1" y="3.52" width="17.84" height="1.41" />
    </g>
  </g>
</svg>
`,
  
  '<>': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.84 17.18">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <polygon
        class="cls-1"
        points="17.84 7.24 17.84 5.83 10.89 5.83 14.26 0 12.6 0.05 9.27 5.83 0 5.83 0 7.24 8.45 7.24 7.24 9.35 0 9.35 0 10.76 6.42 10.76 2.71 17.18 4.34 17.18 8.05 10.76 17.84 10.76 17.84 9.35 8.86 9.35 10.08 7.24 17.84 7.24"
      />
    </g>
  </g>
</svg>
`,
  
  '<': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.77 13.52">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M13.77,2.55,2.86,6.76,13.77,11v2.55L0,8.08V5.44L13.77,0Z"
      />
    </g>
  </g>
</svg>
`,
  
  '>': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.77 13.52">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M0,11,10.91,6.76,0,2.55V0L13.77,5.44V8.08L0,13.52Z"
      />
    </g>
  </g>
</svg>
`,
  
  '<=': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.77 18.26">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M13.77,2.55,2.86,6.76,13.77,11v2.55L0,8.08V5.44L13.77,0Z"
      />
      <polygon
        class="cls-1"
        points="13.77 18.26 0 12.27 0 10.09 13.77 15.8 13.77 18.26"
      />
    </g>
  </g>
</svg>
`,
  
  '>=': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.77 18.26">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <path
        class="cls-1"
        d="M0,0,13.77,5.44V8.08L0,13.52V11L10.91,6.76,0,2.55Z"
      />
      <polygon
        class="cls-1"
        points="0 18.26 13.77 12.27 13.77 10.09 0 15.8 0 18.26"
      />
    </g>
  </g>
</svg>
`,
  
  between: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.61 6.51">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_2-2" data-name="Capa 2">
      <polygon
        class="cls-1"
        points="14.04 0 14.04 2.37 1.56 2.37 1.56 0 0 0 0 2.37 0 4.08 0 6.51 1.56 6.51 1.56 4.08 14.04 4.08 14.04 6.51 15.61 6.51 15.61 4.08 15.61 2.37 15.61 0 14.04 0"
      />
    </g>
  </g>
</svg>
`,


  // 🔍 Search icon
  "search-icon": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="7" stroke="#000" stroke-width="2" fill="none"/>
  <line x1="16" y1="16" x2="22" y2="22" stroke="#000" stroke-width="2"/>
</svg>
`,

  // ▶ Expand icon (right arrow)
  "expand-icon": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <polyline points="8 4 16 12 8 20" fill="none" stroke="#000" stroke-width="2"/>
</svg>
`,

  // ▼ Collapse icon (down arrow)
  "collapse-icon": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <polyline points="4 8 12 16 20 8" fill="none" stroke="#000" stroke-width="2"/>
</svg>
`,

  // ☐ Checkbox empty
  "checkbox-unchecked": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <rect x="2" y="2" width="16" height="16" stroke="#000" stroke-width="2" fill="none"/>
</svg>
`,

  // ☑ Checkbox checked
  "checkbox-checked": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <rect x="2" y="2" width="16" height="16" stroke="#000" stroke-width="2" fill="none"/>
  <polyline points="5 10 9 14 15 6" fill="none" stroke="#000" stroke-width="2"/>
</svg>
`,

  // ◫ Checkbox indeterminate
  "checkbox-indeterminate": `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <rect x="2" y="2" width="16" height="16" stroke="#000" stroke-width="2" fill="none"/>
  <rect x="5" y="9" width="10" height="2" fill="#000"/>
</svg>
`,


"filter-header": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
</svg>`,

"filter-active": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
  <circle cx="19" cy="5" r="3" fill="#667eea"/>
</svg>`,


"ascending":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.95 45.29">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_1-2" data-name="Capa 1">
      <polygon
        class="cls-1"
        points="48.95 13.4 35.55 0 35.54 0 35.54 0 22.14 13.4 24.86 16.13 33.64 7.35 33.64 45.29 37.48 45.29 37.48 7.38 46.23 16.13 48.95 13.4"
      />
      <path
        class="cls-1"
        d="M17.6,17.53v2.26H2.38V18L13.83,3.83H2.56V1.57H17.27V3.34L5.86,17.53Z"
      />
      <path
        class="cls-1"
        d="M14.37,39.6H4.69l-2,4.56H0L8.25,25.94h2.58l8.28,18.22H16.37Zm-.91-2.08L9.53,28.59,5.6,37.52Z"
      />
    </g>
  </g>
</svg>
`,
"descending":`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.95 45.29">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_1-2" data-name="Capa 1">
      <polygon
        class="cls-1"
        points="22.14 31.89 35.54 45.29 35.54 45.29 35.55 45.29 48.95 31.89 46.23 29.16 37.45 37.94 37.45 0 33.6 0 33.6 37.91 24.86 29.16 22.14 31.89"
      />
      <path
        class="cls-1"
        d="M17.6,17.53v2.26H2.38V18L13.83,3.83H2.56V1.57H17.27V3.34L5.86,17.53Z"
      />
      <path
        class="cls-1"
        d="M14.37,39.6H4.69l-2,4.56H0L8.25,25.94h2.58l8.28,18.22H16.37Zm-.91-2.08L9.53,28.59,5.6,37.52Z"
      />
    </g>
  </g>
</svg>

`,

"clearSorting":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.1 19.2">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_1-2" data-name="Capa 1">
      <rect class="cls-1" x="4.24" y="6.41" width="2.75" height="2.75" />
      <rect class="cls-1" x="8.58" y="6.41" width="5.61" height="2.75" />
      <polygon
        class="cls-1"
        points="19.1 17.47 16.93 15.3 18.97 13.26 17.36 11.66 15.33 13.7 13.16 11.53 11.56 13.13 13.72 15.3 11.42 17.6 13.03 19.2 15.33 16.9 17.5 19.07 19.1 17.47"
      />
      <path
        class="cls-1"
        d="M17.52,0H.87A.87.87,0,0,0,0,.87V14.71a.87.87,0,0,0,.87.87H9.45V13.52H2.19V2.24H16.31V9.52h2.08V.87A.87.87,0,0,0,17.52,0Z"
      />
    </g>
  </g>
</svg>
`,
"clearAllSorting":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.31 22.97">
  <defs>
    <style>
      .cls-1 {
        fill: #161615;
      }
    </style>
  </defs>
  <g id="Capa_2" data-name="Capa 2">
    <g id="Capa_1-2" data-name="Capa 1">
      <rect class="cls-1" x="8.45" y="10.18" width="2.75" height="2.75" />
      <rect class="cls-1" x="12.78" y="10.18" width="5.61" height="2.75" />
      <polygon
        class="cls-1"
        points="23.31 21.23 21.14 19.06 23.18 17.03 21.57 15.42 19.54 17.46 17.37 15.29 15.76 16.89 17.93 19.06 15.63 21.36 17.23 22.97 19.54 20.67 21.7 22.84 23.31 21.23"
      />
      <path
        class="cls-1"
        d="M17.52,0H.87A.87.87,0,0,0,0,.87V13.52H2.19V2.24h16.2V.87A.87.87,0,0,0,17.52,0Z"
      />
      <path
        class="cls-1"
        d="M21.73,3.77H5.08a.87.87,0,0,0-.87.87V18.47a.87.87,0,0,0,.87.87h8.58V17.28H6.39V6H20.52v7.29H22.6V4.64A.87.87,0,0,0,21.73,3.77Z"
      />
    </g>
  </g>
</svg>
`

  };



export function getFilterIcon(operator: string): string {
  return filterIcons[operator] || '';
}