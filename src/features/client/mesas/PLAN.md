# Plan: POS/Mesas con datos reales + WebSockets

## Estado actual
El módulo `/pos/mesas` corre 100% en demo data (`mesas.demo.ts`).
Los servicios en `mesas.service.ts` ya existen con los endpoints correctos pero nunca se invocan.
No hay `socket.io-client` en `package.json`.

---

## Preguntas resueltas

- [x] **`Mesa.personas`** — El servicio backend hace `findAll` simple sin JOIN a órdenes. El campo **no existe ni se computa**. Se muestra `—` en el floor plan; el conteo real se obtiene al abrir la orden via `getOrdenActivaMesa()`.
- [x] **`Orden.propina`** — **No aplica**. No hay columna `propina` en la tabla `ordenes`. Removido correctamente de tipos y renders.
- [x] **Socket namespace** — Confirmado: **`/pos`**. Gateway: `@WebSocketGateway({ namespace: '/pos' })`. Conexión: `io('/pos', { auth: { token, sucursal_id, rol } })`.
- [x] **`sucursal_id` en sesión** — El gateway lee `auth.sucursal_id` y cae a `user.sucursal_id` como fallback. **Se envía explícitamente** en el handshake para no depender del fallback.

---

## Fases

### Fase 1 — Dependencia
- [x] Instalar `socket.io-client` (`npm install socket.io-client`)

---

### Fase 2 — Alinear tipos con la BD
**Archivo:** `mesas.types.ts`

- [x] `Articulo.precio` → renombrado a `precio_venta`
- [x] `Mesa.personas` → opcional (`personas?: number`) — campo computado por backend
- [x] `Orden.propina` → removido (no existe en BD)
- [x] `Orden.numero` → alineado con `numero_orden` (INT en BD)
- [x] Agregar tipos para payloads de socket:
  - [x] `MesaEstadoCambioPayload`
  - [x] `MesaPresenciaPayload`
  - [x] `KdsNuevaLineaPayload`
  - [x] `KdsOrdenCompletaPayload`
  - [x] `CajaOrdenListaCobrarPayload`
  - [x] `CajaPagoRegistradoPayload`
  - [x] `CajaTurnoPayload`
  - [x] `CajaOrdenAnuladaPayload`
  - [x] `ErrorEventoPayload`

---

### Fase 3 — Servicio de WebSockets POS
**Archivo nuevo:** `src/features/client/shared/services/pos-socket.ts`

- [x] Crear clase `PosSocketService`
- [x] `connect(token, sucursalId)` — handshake con JWT
- [x] `disconnect()`
- [x] Métodos de emisión (cliente → servidor):
  - [x] `emitUsuarioEntro(mesaId)`
  - [x] `emitUsuarioSalio(mesaId)`
  - [x] `emitEnviarCocina(ordenId, lineas)`
  - [x] `emitLineaEnPreparacion(lineaId)`
  - [x] `emitLineaLista(lineaId)`
- [x] Métodos de escucha (servidor → cliente):
  - [x] `onMesaPresencia(cb)`       — `mesa:presencia_actual`
  - [x] `onMesaEstadoCambio(cb)`    — `mesa:estado_cambio`
  - [x] `onKdsNuevaLinea(cb)`       — `kds:nueva_linea`
  - [x] `onKdsOrdenCompleta(cb)`    — `kds:orden_completa`
  - [x] `onCajaOrdenListaCobrar(cb)`— `caja:orden_lista_cobrar`
  - [x] `onCajaPagoRegistrado(cb)`  — `caja:pago_registrado`
  - [x] `onCajaTurnoAbierto(cb)`    — `caja:turno_abierto`
  - [x] `onCajaTurnoCerrado(cb)`    — `caja:turno_cerrado`
  - [x] `onCajaOrdenAnulada(cb)`    — `caja:orden_anulada`
  - [x] `onError(cb)`               — `error:evento`
- [x] Singleton `posSocket` exportado

---

### Fase 4 — Actualizar mesas.service.ts
**Archivo:** `mesas.service.ts`

- [x] `getZonas(sucursalId)` → `GET /api/zonas?sucursal_id=X&estado=activo`
- [x] `getMesas(sucursalId)` → `GET /api/mesas?sucursal_id=X`
- [x] `getFamilias(sucursalId)` → `GET /api/familias?sucursal_id=X&estado=activo`
- [x] `getArticulos(familiaId)` → `GET /api/articulos?familia_id=X&estado=activo`
- [x] Agregar `getOrdenActivaMesa(mesaId)` → `GET /api/ordenes?mesa_id=X&estado=abierta`
- [x] `createLinea` con payload tipado (incluye `modificadores[]`)

---

### Fase 5 — Refactorizar mesas.ts (orquestador principal)
**Archivo:** `mesas.ts`

#### Carga inicial
- [x] Reemplazar `DEMO.zonas` con `getZonas(sucursalId)`
- [x] Reemplazar `DEMO.mesas` con `getMesas(sucursalId)`
- [x] Reemplazar polling simulado con suscripción al socket

#### Abrir TPV
- [x] Mesa libre → llamar `createOrden({ mesa_id, sucursal_id, usuario_id, tipo_servicio })`
- [x] Mesa ocupada → llamar `getOrdenActivaMesa(mesaId)` + `getLineas(ordenId)`
- [x] Emitir `socket.emitUsuarioEntro(mesaId)`

#### Cargar pantalla TPV
- [x] Reemplazar `DEMO.familias` con `getFamilias(sucursalId)`
- [x] Reemplazar `DEMO.articulos[familiaId]` con `getArticulos(familiaId)`
- [x] Reemplazar `DEMO.modificadores[artId]` con `getModificadores(articuloId)`

#### Enviar a cocina
- [x] Llamar `createLinea()` para cada línea nueva (IDs temporales negativos)
- [x] Llamar `enviarCocina(ordenId)` → HTTP POST
- [x] Emitir `socket.emitEnviarCocina(ordenId, lineas)`

#### Pedir cuenta
- [x] Llamar `pedirCuenta(ordenId)` → HTTP POST
- [x] Mantener BroadcastChannel como fallback mismo-tab

#### Cerrar TPV
- [x] Emitir `socket.emitUsuarioSalio(mesaId)` al volver a floor plan

#### Suscripciones de socket
- [x] `onMesaEstadoCambio` → `store.patchMesa()` + re-render floor plan
- [x] `onCajaPagoRegistrado` → `patchMesa(libre)` + re-render
- [x] `onCajaOrdenAnulada` → `patchMesa(libre)` + toast

---

### Fase 6 — Actualizar módulo Caja
**Archivos:** `caja.ts`, `caja.service.ts`, `caja.types.ts`, `caja.store.ts`

- [x] Conectar `PosSocketService` en caja
- [x] Escuchar `caja:orden_lista_cobrar` → recibir órdenes en tiempo real
- [x] Escuchar `caja:pago_registrado` → limpiar ticket si lo cobró otro terminal
- [x] Escuchar `caja:orden_anulada` → limpiar cola
- [x] Remover formas de pago hardcodeadas del store
- [x] Agregar `setFormasPago()` al store
- [x] Cargar formas de pago desde `getFormasPago()` en init
- [x] Llamar `confirmarCobro(ordenId, pagos)` al finalizar cobro
- [x] Alinear `OrdenCobro` con BD (`numero_orden`, `impuestos_total`, sin `propina`)
- [x] Remover `propina` de `TotalesCuenta`

---

### Fase 7 — KDS (cocina)
**Archivos:** `KdsModule.ts`, `kds.types.ts`

- [x] Agregar `sucursalId` a `KdsConfig`
- [x] Conectar `PosSocketService` al montar el módulo
- [x] `onKdsNuevaLinea` → agregar tarjeta o línea a comanda existente
- [x] `onKdsOrdenCompleta` → marcar comanda como lista
- [x] Emitir `emitLineaEnPreparacion(id)` al cambiar estado a en_preparacion
- [x] Emitir `emitLineaLista(id)` al marcar lista

---

---

### Fase 8 — Selección de sucursal en el lobby
**Archivos:** `session.service.ts`, `lobby.ts`, `lobby.html`, `lobby.css`, `mesas.ts`, `caja.ts`, `cocina.ts`, `barra.ts`

- [x] `LobbyContext` actualizado: `id_parque`/`nombre_parque` → `sucursal_id`/`nombre_sucursal`
- [x] `getSucursalId()` — helper que lee `LobbyContext.sucursal_id`
- [x] `lobby.ts` — si es **Administrador**: abrir modal con select de sucursales (API real)
- [x] `lobby.ts` — si es **otro rol con `sucursal_id`**: guardar contexto y navegar directo
- [x] `lobby.ts` — si es **otro rol sin `sucursal_id`**: mostrar banner de error y no navegar
- [x] Modal y banner de error añadidos a `lobby.html` + `lobby.css`
- [x] Todos los módulos POS usan `getSucursalId()` en lugar de `user?.sucursal_id`

---

## Orden de ejecución (completado)

```
✅ 1. npm install socket.io-client
✅ 2. Alinear mesas.types.ts con BD
✅ 3. Crear pos-socket.ts
✅ 4. Actualizar mesas.service.ts (filtros por sucursal_id)
✅ 5. Actualizar mesas.store.ts (nuevos tipos, lineasNuevasIds)
✅ 6. Actualizar tpv.ts (precio_venta, numero_orden, impuestos_total)
✅ 7. Refactorizar mesas.ts (reemplazar DEMO data + conectar socket)
✅ 8. Actualizar caja.types.ts + caja.store.ts + caja.ts
✅ 9. Actualizar KdsModule.ts + kds.types.ts
```

---

## Discrepancias tipos vs BD (resueltas)

| Campo en frontend | Columna real en BD | Resolución |
|---|---|---|
| `Articulo.precio` | `articulos.precio_venta` | Renombrado a `precio_venta` |
| `Articulo.tiene_mods` | No existe — derivado de `articulo_grupos_modificadores` | Backend computa, campo se mantiene |
| `Mesa.personas` | No existe — derivado de la orden activa | Campo opcional, backend lo agrega |
| `Orden.propina` | No existe en `ordenes` | Removido de tipos y renders |
| `Orden.numero` (string) | `ordenes.numero_orden` (INT) | Renombrado, se hace `.padStart(4,'0')` al mostrar |
| `GrupoModificador.opciones` | Tabla `modificadores` con `grupo_modificador_id` | Backend devuelve anidado |
