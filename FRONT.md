# FRONT.md — Guía de endpoints (Savvi API)

Referencia rápida para el equipo de frontend. Detalle completo de cada schema en **Swagger: `<base>/docs`**.

- **Base URL:** la del entorno (en dev depende de `PORT`, p. ej. `http://localhost:3001`)
- **Auth:** todo requiere JWT salvo lo marcado como *público*.

```http
Authorization: Bearer <token>
Content-Type: application/json
```

- El token sale de `POST /auth/login` (`access_token`). Sin token → `401`.
- El `userId` **siempre** se toma del token: nunca lo mandes en el body ni en la query.
- Todos los `:id` son **UUID**; un UUID mal formado responde `400`.
- Lo que no es tuyo responde `404` (no `403`).

---

## Auth *(público)*

| Método | Ruta             | Body                            | Respuesta                  |
| ------ | ---------------- | ------------------------------- | -------------------------- |
| `POST` | `/auth/register` | `name`, `email`, `password` (≥6) | `{ user, access_token }`   |
| `POST` | `/auth/login`    | `email`, `password`              | `{ user, access_token }`   |

Guarda `access_token` y mándalo en el header de todo lo demás.

## Waitinglist *(público)*

| Método | Ruta           | Body                    |
| ------ | -------------- | ----------------------- |
| `POST` | `/waitinglist` | `email`, `description?` |

## Health *(público)*

| Método | Ruta | Para qué        |
| ------ | ---- | --------------- |
| `GET`  | `/`  | Health check    |

---

## Accounts

| Método   | Ruta             | Body / notas |
| -------- | ---------------- | ------------ |
| `POST`   | `/accounts`      | `name` (req.), `icon?`, `color?` (hex), `description?`, `isActive?`, `isCredit?`, `creditLimit?`, `aprRate?`, `gracePeriodDays?`, `statementDay?`, `dueDay?`, `minPaymentPercent?`, `minPaymentAmount?`, `initialBalance?` |
| `GET`    | `/accounts`      | Cuentas del usuario |
| `GET`    | `/accounts/:id`  | — |
| `PATCH`  | `/accounts/:id`  | Parcial: solo los campos que cambian |
| `DELETE` | `/accounts/:id`  | — |

> Los campos de tarjeta de crédito (`creditLimit`, `aprRate`, `statementDay`, …) solo aplican si `isCredit: true`.

## Categories

| Método   | Ruta                       | Body / notas |
| -------- | -------------------------- | ------------ |
| `POST`   | `/categories`              | `name`, `type` (`ingreso` \| `egreso`), `icon?`, `color?`, `description?`, `parentId?`, `budgetLimit?`, `isActive?`, `isDefault?` |
| `GET`    | `/categories`              | — |
| `GET`    | `/categories/:id`          | — |
| `PATCH`  | `/categories/:id`          | Parcial |
| `PATCH`  | `/categories/:id/budget`   | `budgetLimit` — atajo para editar solo el límite |
| `DELETE` | `/categories/:id`          | — |

> `parentId` permite subcategorías.

## Budgets

| Método   | Ruta                                | Body / notas |
| -------- | ----------------------------------- | ------------ |
| `POST`   | `/budgets`                          | `categoryId`, `amount`, `year`, `month` (1–12), `period` (`monthly`), `amountAutoCalculated?`, `isActive?` |
| `GET`    | `/budgets`                          | — |
| `GET`    | `/budgets/:id`                      | — |
| `PATCH`  | `/budgets/:id`                      | Parcial |
| `DELETE` | `/budgets/:id`                      | — |
| `POST`   | `/budgets/:id/details`              | Partida: `label`, `description?`, `estimatedAmount?`, `sortOrder?` |
| `PATCH`  | `/budgets/:id/details/:detailId`    | Parcial |
| `DELETE` | `/budgets/:id/details/:detailId`    | — |

> Con `amountAutoCalculated: true` el `amount` se recalcula desde la suma de las partidas (no lo mandes ni lo edites en la UI). Si es `false`, `amount` debe ser > 0.
> `POST /budgets` sobre una categoría + año + mes que ya tiene presupuesto **actualiza el existente** en vez de duplicar.

## Transactions

| Método   | Ruta                                        | Body / notas |
| -------- | ------------------------------------------- | ------------ |
| `POST`   | `/transactions`                             | `date` (`YYYY-MM-DD`), `type`, `amount` (>0, 2 dec.), `category`, `account`, `description?` |
| `POST`   | `/transactions/bulk`                        | Array de lo anterior → `{ count, data }` |
| `GET`    | `/transactions`                             | Del usuario, de la más reciente a la más antigua |
| `GET`    | `/transactions/:id`                         | — |
| `PATCH`  | `/transactions/:id`                         | **Editar**: campos + `documentsToDelete?` + `filesToAdd?` (ver abajo) |
| `DELETE` | `/transactions/:id`                         | Borra la transacción **y todos sus adjuntos** → `{ ..., deletedDocuments }` |
| `GET`    | `/transactions/:id/documents`               | Adjuntos con `url` de descarga (caduca en 1 h) |
| `POST`   | `/transactions/:id/documents`               | Subir archivos nuevos (multipart, campo `files`, máx. 10) |
| `DELETE` | `/transactions/:id/documents/:documentId`   | Elimina un adjunto (S3 + BD), definitivo |
| `POST`   | `/transactions/confirm-upload`              | `transactionId`, `files: [{ key, name, size }]` — vincula lo subido por URL prefirmada |
| `POST`   | `/transactions/upload-files`                | Legacy: multipart con `transactionId` en el body |

`amount` puede llegar como string (`"52000.00"`) por el `decimal` de Postgres → usa `Number()` antes de sumar o formatear.

### Editar una transacción

Un solo `PATCH` hace todo. Manda solo lo que cambió:

```json
{
  "amount": 52000,
  "description": "Compra supermercado (corregido)",
  "documentsToDelete": ["9f2b0c1e-..."],
  "filesToAdd": [{ "key": "transactions/1714000000000-factura.pdf", "name": "factura.pdf", "size": 245678 }]
}
```

- `documentsToDelete` (máx. 50): IDs de `GET /transactions/:id/documents`. Se borran de S3 y BD.
- `filesToAdd` (máx. 10): archivos ya subidos a S3 con URL prefirmada.
- Responde la transacción actualizada **con su array `documents`** → repinta el detalle sin otra llamada.
- Si un ID de `documentsToDelete` no existe → `404` y **no se borra nada** de esa lista.

En UI: marca los adjuntos con un “quitar” local y mándalos en `documentsToDelete` al guardar, así cancelar la edición no pierde archivos. Para borrado inmediato fuera del formulario, usa `DELETE /transactions/:id/documents/:documentId` con confirmación.

## Payment Planner (deudas)

| Método   | Ruta                                       | Body / notas |
| -------- | ------------------------------------------ | ------------ |
| `POST`   | `/payment-planner`                         | `name`, `payee`, `totalAmount`, `dueDate` (`YYYY-MM-DD`), `accountId`, `notes?`, `isRecurring?`, `recurrenceType?` (`monthly` \| `biweekly`), `recurrenceDay?` |
| `GET`    | `/payment-planner`                         | Todas las deudas |
| `GET`    | `/payment-planner/pending`                 | Solo pendientes |
| `GET`    | `/payment-planner/total-paid`              | `{ total }` |
| `GET`    | `/payment-planner/:id`                     | — |
| `PATCH`  | `/payment-planner/:id`                     | Parcial |
| `DELETE` | `/payment-planner/:id`                     | — |
| `POST`   | `/payment-planner/:id/register-payment`    | `amount`, `account`, `category`, `paidAt?`, `description?` |

> `register-payment` crea también la transacción del abono y actualiza el saldo: no crees la transacción por tu cuenta.

## Transfer Templates

| Método   | Ruta                              | Body / notas |
| -------- | --------------------------------- | ------------ |
| `POST`   | `/transfer-templates`             | `fromAccountId`, `name`, `payeeName`, `recurrenceType` (`reminder` \| `automatic`), `frequency` (`weekly` \| `biweekly` \| `monthly` \| `bimonthly` \| `custom`), `dayOfMonth` (1–28), `payeeAccount?`, `payeeBank?`, `initialAmount?`, `customIntervalDays?` (si `frequency: custom`) |
| `GET`    | `/transfer-templates`             | — |
| `PATCH`  | `/transfer-templates/:id`         | Parcial |
| `PATCH`  | `/transfer-templates/:id/toggle`  | Activa / desactiva (sin body) |
| `POST`   | `/transfer-templates/:id/execute` | `amount`, `transactionType?` (`ingreso` \| `egreso` \| `transferencia`), `description?` → crea la transacción y reprograma el próximo vencimiento |
| `DELETE` | `/transfer-templates/:id`         | — |

## Reminders

| Método  | Ruta                     | Notas |
| ------- | ------------------------ | ----- |
| `GET`   | `/reminders`             | Recordatorios pendientes generados por las plantillas |
| `PATCH` | `/reminders/:id/dismiss` | Descarta el recordatorio (sin body) |

## AI Register

| Método | Ruta                    | Body / notas |
| ------ | ----------------------- | ------------ |
| `POST` | `/ai-register/jobs`     | `key` (de la URL prefirmada), `name`, `size`, `mimeType`, `userText?` → job encolado |
| `GET`  | `/ai-register/jobs/:id` | `{ id, status: queued\|processing\|completed\|failed, error?, transactionId? }` |

> Es asíncrono: sube el archivo a S3, crea el job y haz polling al `GET` hasta `completed` (trae el `transactionId` creado) o `failed`.

## S3

| Método | Ruta                 | Body / notas |
| ------ | -------------------- | ------------ |
| `POST` | `/s3/presigned-url`  | `filename`, `contentType`, `folder?` (def. `uploads`), `fileSize?` → `{ url, key }` |
| `GET`  | `/s3/presigned-url`  | Query `folder`, `fileName`, `expiresIn?` — alternativa |

---

## Subida de archivos (flujo recomendado)

1. `POST /s3/presigned-url` con `folder: "transactions"` → `{ url, key }`. **La URL expira en 60 s**: pídela justo antes de subir.
2. `PUT` del archivo a esa `url` con `Content-Type` igual al enviado. **Sin header `Authorization`** (la firma va en la URL; si lo mandas → `403`).
3. Vincula la `key`: en edición con `filesToAdd` del `PATCH`, o con `POST /transactions/confirm-upload`.

```ts
const { url, key } = await api.post('/s3/presigned-url', {
  filename: file.name, contentType: file.type, folder: 'transactions', fileSize: file.size,
});
await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
// luego: PATCH /transactions/:id con filesToAdd: [{ key, name: file.name, size: file.size }]
```

Alternativa multipart (`POST /transactions/:id/documents`): `FormData` con el campo `files`; **no fijes `Content-Type`**, lo pone el browser con el boundary.

**Límites:** 20 MB por archivo, 10 archivos por petición. Tipos permitidos:

```
application/pdf
image/jpeg  image/jpg  image/png  image/webp
audio/mpeg  audio/mp3  audio/wav  audio/x-wav  audio/webm  audio/ogg  audio/mp4  audio/x-m4a
application/vnd.openxmlformats-officedocument.wordprocessingml.document   (.docx)
```

Valida tipo y tamaño en el cliente antes de pedir la URL. Las `url` de descarga caducan en 1 h: no las caches, recárgalas al abrir el detalle.

---

## Errores

| Código | Cuándo |
| ------ | ------ |
| `400`  | Validación fallida (monto, fecha, UUID, tipo de archivo) |
| `401`  | Falta el token o expiró |
| `404`  | No existe o no pertenece al usuario del token |
| `500`  | Error contra S3 |

```json
{ "statusCode": 404, "message": "Transacción no encontrada", "error": "Not Found" }
```

Los campos desconocidos del body se descartan silenciosamente (`whitelist: true`).
