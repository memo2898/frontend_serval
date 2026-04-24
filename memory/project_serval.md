---
name: Sistema Restaurantes Serval - Contexto del Proyecto
description: Stack, roles, rutas, estructura y decisiones arquitectónicas del frontend Serval
type: project
---

Frontend Serval es un POS (punto de venta) para restaurantes. Stack: Vanilla TypeScript + Vite, sin frameworks de UI. MPA (multi-page app) con HTML/CSS/TS por página.

**Roles del sistema (guardan_auth.ts ROLE_DEFAULT_ROUTES):**
- `camarero` → `/pos/mesas` (toma órdenes en mesa)
- `cajero` → `/pos/caja` (solo cobrar)
- `cajero-gestor` → `/pos/cajero-gestor` (cobrar + hacer pedidos desde caja)
- `cocinero` → `/pos/cocina`
- `bartender` → `/pos/barra`
- `encargado` → `/tipodocumentos` (backoffice)

**Backend:** NestJS API en `api-serval/src/`. mesa_id es OPCIONAL en createOrden (DTO lo tiene como @IsOptional). Órdenes sin mesa usan tipo_servicio: 'take_away'.

**Estructura client features:** `src/features/client/{caja,mesas,cajero-gestor,cocina,barra,lobby,login,shared}`

**Patrón de página:** Cada página es una clase (e.g. CajaPage) + services + store + types + html + css.

**Socket:** pos-socket.ts usa `['websocket', 'polling']` como transports (doble fallback para internet inestable). Emite custom events DOM: pos-socket:connected, pos-socket:disconnected, pos-socket:error.

**Cajero-gestor (creado 2026-04-18):** Página que combina caja (cobro completo) + modal "Nuevo Pedido". El modal tiene 3 pasos:
1. Tipo: Mostrador (take_away sin mesa) o Por Mesa
2. Si Por Mesa: seleccionar mesa del listado por zonas + camarero de la sucursal
3. TPV: catálogo de artículos + lista de pedido → Enviar a Cocina

**Why:** Camareros temporalmente sin acceso, el cajero-gestor hace ambas funciones.
**How to apply:** Si se necesita añadir funcionalidad al cajero-gestor, editar `src/features/client/cajero-gestor/cajero-gestor.ts`.
