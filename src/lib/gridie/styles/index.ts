// src/gridie/styles/index.ts
import gridieStylesRaw from "./gridie.css?raw";
import filterRowStylesRaw from "./filterRow.css?raw";
import paginationStylesRaw from "./pagination.css?raw";

export const gridieStyles = gridieStylesRaw;
export const filterRowStyles = filterRowStylesRaw;
export const paginationStyles = paginationStylesRaw;

// IMPORTANTE: Importar sin ?raw para que Vite extraiga el CSS
import "./gridie.css";
import "./filterRow.css";
import "./pagination.css";
