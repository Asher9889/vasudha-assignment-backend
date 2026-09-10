# Dataset Module API

Base URL: `/api/v1/datasets`

---

## 1. Upload CSV

```
POST /api/v1/datasets/upload
```

Uploads a CSV file, parses it, validates rows, and returns the parsed data along with a `fileKey` needed for dataset creation.

**Auth Required:** None

**Content-Type:** `multipart/form-data`

**Form Field:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | **Yes** | The CSV file to upload |

**Constraints:**

| Rule | Value |
|------|-------|
| Allowed MIME types | `text/csv`, `application/vnd.ms-excel` |
| Max file size | Configured via `MULTER_FILE_SIZE_LIMIT` env var (MB) |
| Storage | Saved to local `uploads/` dir with a random filename |

> The file is written to disk under `uploads/{fieldname}-{hex}.csv`, then streamed and parsed row-by-row using `csv-parser`.

**Example Request (cURL):**

```bash
curl -X POST http://localhost:3000/api/v1/datasets/upload \
  -F "file=@./renewable-energy.csv"
```

**Sample CSV (`renewable-energy.csv`):**

```csv
latitude,longitude,value
23.7337,69.8597,85
8.7139,77.7567,95
24.476,74.862,75
13.3379,77.101,60
```

**Response (200) — all rows valid:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset uploaded successfully",
  "data": {
    "fileKey": "file-abc123def456.csv",
    "results": [
      { "latitude": "23.7337", "longitude": "69.8597", "value": "85" },
      { "latitude": "8.7139", "longitude": "77.7567", "value": "95" },
      { "latitude": "24.476", "longitude": "74.862", "value": "75" },
      { "latitude": "13.3379", "longitude": "77.101", "value": "60" }
    ],
    "wrongData": [],
    "columns": [
      { "name": "latitude", "type": "NUMBER" },
      { "name": "longitude", "type": "NUMBER" },
      { "name": "value", "type": "NUMBER" }
    ],
    "rowCount": 4,
    "validCount": 4,
    "wrongCount": 0
  }
}
```

**Response (200) — with malformed rows:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset uploaded successfully",
  "data": {
    "fileKey": "file-abc123def456.csv",
    "results": [
      { "latitude": "23.7337", "longitude": "69.8597", "value": "85" },
      { "latitude": "8.7139", "longitude": "77.7567", "value": "95" },
      { "latitude": "24.476", "longitude": "74.862", "value": "75" },
      { "latitude": "13.3379", "longitude": "77.101", "value": "60" }
    ],
    "wrongData": [
      {
        "rowNumber": 5,
        "row": { "latitude": "26.9157", "longitude": "70.9083", "value": "" },
        "errors": [
          { "field": "value", "message": "Value for \"value\" cannot be empty" }
        ]
      }
    ],
    "columns": [
      { "name": "latitude", "type": "NUMBER" },
      { "name": "longitude", "type": "NUMBER" },
      { "name": "value", "type": "NUMBER" }
    ],
    "rowCount": 5,
    "validCount": 4,
    "wrongCount": 1
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fileKey` | string | Unique filename on disk. **Pass this in the create dataset request.** |
| `results` | array | Valid rows only; malformed rows are filtered out |
| `wrongData` | array | Malformed rows: `{ rowNumber, row, errors }` |
| `columns` | array | Detected columns: `{ name, type }` where type is inferred |
| `rowCount` | number | Total data rows parsed (header excluded) |
| `validCount` | number | Number of valid rows |
| `wrongCount` | number | Number of malformed rows |

**`wrongData` item:**

| Field | Type | Description |
|-------|------|-------------|
| `rowNumber` | number | 1-based line number in the CSV (header = row 1) |
| `row` | object | The original row data (all values as strings) |
| `errors` | array | `{ field, message }` for each problem found |

**Row Validation Rules:**

| Rule | Error |
|------|-------|
| Any column value is empty / blank | `Value for "field" cannot be empty` |
| `NUMBER` column with non-numeric value | `Value for "field" must be a number` |
| `DATE` column with non-date value | `Value for "field" must be a valid date` |

**Column Type Inference (from first data row):**

| Condition | Inferred `type` |
|-----------|-----------------|
| Value is empty | `STRING` |
| Value is numeric | `NUMBER` |
| Value parses as a date | `DATE` |
| Anything else | `STRING` |

Available types: `STRING` | `NUMBER` | `DATE`

> Row values in `results` are always strings. Use `columns[].type` to cast them on the frontend.

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| No file sent | 400 | `CSV file is not uploaded` |
| Empty CSV | 400 | `CSV file has no data rows` |
| Duplicate/empty headers | 400 | `CSV header validation failed` |
| Parse failure | 400 | `Failed to upload dataset: <details>` |
| Wrong MIME type | 400 | `Only CSV files are allowed` |
| File too large | 413 | `File too large` |

---

## 2. Create Dataset

```
POST /api/v1/datasets
```

Creates a dataset record and inserts all valid CSV rows into the `dataset_rows` collection with proper type conversion.

**Auth Required:** None

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `fileKey` | string | **Yes** | — | The `fileKey` returned from the upload endpoint |
| `title` | string | **Yes** | — | Dataset title (max 255 chars) |
| `domain` | string | **Yes** | — | `CLIMATE` \| `ENERGY` \| `POWER` |
| `templateType` | string | **Yes** | — | `LAT_LONG` \| `STATE_WISE` \| `TIME_SERIES` |
| `chartType` | string | **Yes** | — | `BAR` \| `LINE` \| `PIE` \| `INDIA_MAP` \| `STATE_HEATMAP` |
| `uploadedBy` | string | **Yes** | — | Valid MongoDB ObjectId |
| `status` | string | No | `PENDING` | `PENDING` \| `APPROVED` \| `REJECTED` |
| `file` | object | **Yes** | — | `{ originalName, mimeType, size }` |
| `csvSchema` | object | **Yes** | — | `{ columns: [{ name, type }] }` |
| `visualizationConfig` | object | **Yes** | — | Must match `templateType` (see below) |
| `rowCount` | number | **Yes** | — | Total rows in the CSV |
| `approvedBy` | string \| null | No | `null` | Valid MongoDB ObjectId or null |
| `approvedAt` | string \| null | No | `null` | ISO date string or null |
| `publishedAt` | string \| null | No | `null` | ISO date string or null |

**`visualizationConfig` by `templateType`:**

| templateType | Required Fields |
|--------------|-----------------|
| `LAT_LONG` | `latitudeColumn`, `longitudeColumn`, `valueColumn` |
| `STATE_WISE` | `stateColumn`, `valueColumn` |
| `TIME_SERIES` | `xAxisColumn`, `valueColumn` |

**`file` object:**

| Field | Type | Description |
|-------|------|-------------|
| `originalName` | string | Original filename (e.g. `renewable-energy.csv`) |
| `mimeType` | string | MIME type (e.g. `text/csv`) |
| `size` | number | File size in bytes |

**`csvSchema.columns` item:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Column name (must match CSV header) |
| `type` | string | `STRING` \| `NUMBER` \| `DATE` |

**Example Request (cURL):**

```bash
curl -X POST http://localhost:3000/api/v1/datasets \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "file-abc123def456.csv",
    "title": "Renewable Energy Locations",
    "domain": "ENERGY",
    "templateType": "LAT_LONG",
    "chartType": "INDIA_MAP",
    "uploadedBy": "68c1f91a2b3c4d5e6f789012",
    "file": {
      "originalName": "renewable-energy.csv",
      "mimeType": "text/csv",
      "size": 15432
    },
    "csvSchema": {
      "columns": [
        { "name": "latitude", "type": "NUMBER" },
        { "name": "longitude", "type": "NUMBER" },
        { "name": "value", "type": "NUMBER" }
      ]
    },
    "visualizationConfig": {
      "latitudeColumn": "latitude",
      "longitudeColumn": "longitude",
      "valueColumn": "value"
    },
    "rowCount": 4
  }'
```

**Response (201) — success:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Dataset created successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f78901234",
    "title": "Renewable Energy Locations",
    "domain": "ENERGY",
    "templateType": "LAT_LONG",
    "chartType": "INDIA_MAP",
    "uploadedBy": "68c1f91a2b3c4d5e6f789012",
    "status": "PENDING",
    "file": {
      "originalName": "renewable-energy.csv",
      "mimeType": "text/csv",
      "size": 15432
    },
    "csvSchema": {
      "columns": [
        { "name": "latitude", "type": "NUMBER" },
        { "name": "longitude", "type": "NUMBER" },
        { "name": "value", "type": "NUMBER" }
      ]
    },
    "visualizationConfig": {
      "latitudeColumn": "latitude",
      "longitudeColumn": "longitude",
      "valueColumn": "value"
    },
    "rowCount": 4,
    "approvedBy": null,
    "approvedAt": null,
    "publishedAt": null,
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "wrongRows": []
  }
}
```

**What happens on creation:**

1. `fileKey` is used to locate the CSV on disk
2. CSV is re-parsed and validated (same rules as upload)
3. Dataset record is saved to `datasets` collection
4. Each valid row is type-converted and inserted into `dataset_rows`:

| Column Type | Stored As |
|-------------|-----------|
| `NUMBER` | `Number(value)` |
| `DATE` | `new Date(value)` |
| `STRING` | string |
| empty | `null` |

5. `wrongRows` in the response contains any rows that failed validation

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| Duplicate title | 400 | `Dataset with this title already exists` |
| Missing required field | 400 | Zod validation error for the specific field |
| Invalid `visualizationConfig` for `templateType` | 400 | `visualizationConfig must have ... for {templateType} template` |
| CSV file not found on disk | 400 | `Failed to create dataset: ...` |
| Empty CSV | 400 | `CSV file has no data rows` |

---

## 3. Get Datasets (Metadata List)

```
GET /api/v1/datasets
```

Returns a paginated list of dataset metadata (no row data).

**Auth Required:** None

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number (min 1) |
| `limit` | number | No | `20` | Items per page (1–50) |
| `domain` | string | No | — | Filter by domain: `CLIMATE` \| `ENERGY` \| `POWER` |
| `status` | string | No | — | Filter by status: `PENDING` \| `APPROVED` \| `REJECTED` |
| `search` | string | No | — | Case-insensitive substring match on `title` |
| `sortBy` | string | No | `createdAt` | `createdAt` \| `title` \| `domain` |
| `sortOrder` | string | No | `desc` | `asc` \| `desc` |

**Example Request (cURL):**

```bash
curl -X GET "http://localhost:3000/api/v1/datasets?page=1&limit=10&domain=ENERGY&status=PENDING&sortBy=createdAt&sortOrder=desc"
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Datasets fetched successfully",
  "data": {
    "datasets": [
      {
        "id": "64f1a2b3c4d5e6f78901234",
        "title": "Renewable Energy Locations",
        "domain": "ENERGY",
        "templateType": "LAT_LONG",
        "chartType": "INDIA_MAP",
        "uploadedBy": "68c1f91a2b3c4d5e6f789012",
        "status": "PENDING",
        "file": {
          "originalName": "renewable-energy.csv",
          "mimeType": "text/csv",
          "size": 15432
        },
        "csvSchema": {
          "columns": [
            { "name": "latitude", "type": "NUMBER" },
            { "name": "longitude", "type": "NUMBER" },
            { "name": "value", "type": "NUMBER" }
          ]
        },
        "visualizationConfig": {
          "latitudeColumn": "latitude",
          "longitudeColumn": "longitude",
          "valueColumn": "value"
        },
        "rowCount": 4,
        "approvedBy": null,
        "approvedAt": null,
        "publishedAt": null,
        "createdAt": "2026-09-10T12:00:00.000Z",
        "updatedAt": "2026-09-10T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `datasets` | array | Dataset metadata records (`.lean()`, each has `id`) |
| `pagination.page` | number | Current page |
| `pagination.limit` | number | Items per page |
| `pagination.total` | number | Total matching datasets |
| `pagination.totalPages` | number | Total number of pages |

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| Invalid query param | 400 | Zod query validation error |
| Server error | 500 | `Failed to fetch datasets: <details>` |

---

## 4. Get Dataset by ID (With Row Data)

```
GET /api/v1/datasets/:id
```

Returns a single dataset including all of its row data from the `dataset_rows` collection.

**Auth Required:** None

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Valid MongoDB ObjectId of the dataset |

**Example Request (cURL):**

```bash
curl -X GET http://localhost:3000/api/v1/datasets/64f1a2b3c4d5e6f78901234
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset fetched successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f78901234",
    "title": "Renewable Energy Locations",
    "domain": "ENERGY",
    "templateType": "LAT_LONG",
    "chartType": "INDIA_MAP",
    "uploadedBy": "68c1f91a2b3c4d5e6f789012",
    "status": "PENDING",
    "file": {
      "originalName": "renewable-energy.csv",
      "mimeType": "text/csv",
      "size": 15432
    },
    "csvSchema": {
      "columns": [
        { "name": "latitude", "type": "NUMBER" },
        { "name": "longitude", "type": "NUMBER" },
        { "name": "value", "type": "NUMBER" }
      ]
    },
    "visualizationConfig": {
      "latitudeColumn": "latitude",
      "longitudeColumn": "longitude",
      "valueColumn": "value"
    },
    "rowCount": 4,
    "approvedBy": null,
    "approvedAt": null,
    "publishedAt": null,
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "rows": [
      { "rowIndex": 0, "data": { "latitude": 23.7337, "longitude": 69.8597, "value": 85 } },
      { "rowIndex": 1, "data": { "latitude": 8.7139, "longitude": 77.7567, "value": 95 } },
      { "rowIndex": 2, "data": { "latitude": 24.476, "longitude": 74.862, "value": 75 } },
      { "rowIndex": 3, "data": { "latitude": 13.3379, "longitude": 77.101, "value": 60 } }
    ]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| (all dataset metadata) | — | Same fields as the create/list responses |
| `rows` | array | Row data sorted by `rowIndex` ascending |
| `rows[].rowIndex` | number | Zero-based position of the row in the CSV |
| `rows[].data` | object | The row values with proper types (`NUMBER` → number, `DATE` → date, `STRING` → string) |

> `data` values are **type-converted**, not raw strings — e.g. latitude is `23.7337` (number), not `"23.7337"`.

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| Invalid ObjectId | 400 | `Please provide a valid dataset ID` |
| Dataset not found | 404 | `Dataset not found` |
| Server error | 500 | `Failed to fetch dataset: <details>` |

---

## 5. Update Dataset Status

```
PATCH /api/v1/datasets/:id/status
```

Approves or rejects a dataset. Requires an authenticated admin (`ADMIN` or `SUPER_ADMIN`) via an access-token cookie.

**Auth Required:** Yes — `authenticate` + `authorize(ADMIN, SUPER_ADMIN)`

**Cookies:**

| Cookie | Type | Required | Description |
|--------|------|----------|-------------|
| `accessToken` | string | **Yes** | JWT access token of the admin user |

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Valid MongoDB ObjectId of the dataset |

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | **Yes** | `APPROVED` \| `REJECTED` |
| `rejectionReason` | string | **Only when `REJECTED`** | Reason for rejection (max 500 chars) |

> `rejectionReason` is **required** when `status` is `REJECTED` and is ignored/cleared when approving.

**Example Request (cURL) — approve:**

```bash
curl -X PATCH http://localhost:3000/api/v1/datasets/64f1a2b3c4d5e6f78901234/status \
  -H "Content-Type: application/json" \
  -b "accessToken=eyJhbGciOiJIUzI1NiIs..." \
  -d '{ "status": "APPROVED" }'
```

**Example Request (cURL) — reject:**

```bash
curl -X PATCH http://localhost:3000/api/v1/datasets/64f1a2b3c4d5e6f78901234/status \
  -H "Content-Type: application/json" \
  -b "accessToken=eyJhbGciOiJIUzI1NiIs..." \
  -d '{ "status": "REJECTED", "rejectionReason": "Missing longitude column data" }'
```

**Response (200) — approved:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset status updated successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f78901234",
    "title": "Renewable Energy Locations",
    "domain": "ENERGY",
    "templateType": "LAT_LONG",
    "chartType": "INDIA_MAP",
    "uploadedBy": "68c1f91a2b3c4d5e6f789012",
    "status": "APPROVED",
    "file": {
      "originalName": "renewable-energy.csv",
      "mimeType": "text/csv",
      "size": 15432
    },
    "csvSchema": {
      "columns": [
        { "name": "latitude", "type": "NUMBER" },
        { "name": "longitude", "type": "NUMBER" },
        { "name": "value", "type": "NUMBER" }
      ]
    },
    "visualizationConfig": {
      "latitudeColumn": "latitude",
      "longitudeColumn": "longitude",
      "valueColumn": "value"
    },
    "rowCount": 4,
    "approvedBy": "98c1f91a2b3c4d5e6f789999",
    "approvedAt": "2026-09-11T09:30:00.000Z",
    "publishedAt": "2026-09-11T09:30:00.000Z",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-11T09:30:00.000Z"
  }
}
```

**Response (200) — rejected:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset status updated successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f78901234",
    "title": "Renewable Energy Locations",
    "domain": "ENERGY",
    "templateType": "LAT_LONG",
    "chartType": "INDIA_MAP",
    "uploadedBy": "68c1f91a2b3c4d5e6f789012",
    "status": "REJECTED",
    "rejectionReason": "Missing longitude column data",
    "approvedBy": null,
    "approvedAt": null,
    "publishedAt": null,
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-11T09:30:00.000Z"
  }
}
```

**Behavior:**

| `status` | Fields Updated |
|----------|----------------|
| `APPROVED` | `status`, `approvedBy` (the authenticated admin's id), `approvedAt`, `publishedAt`; `rejectionReason` is cleared |
| `REJECTED` | `status`, `rejectionReason` |

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| No/invalid access token | 401 | `Unauthorized: Access token is required` |
| Non-admin role | 403 | `You are not authorized to perform this action` |
| Invalid ObjectId param | 400 | `Please provide a valid dataset ID` |
| Missing `rejectionReason` on reject | 400 | `rejectionReason is required when rejecting a dataset` |
| Invalid `status` value | 400 | Zod validation error |
| Dataset not found | 404 | `Dataset not found` |
| Server error | 500 | `Failed to update dataset status: <details>` |

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description here",
  "errors": []
}
```

| Status | Meaning |
|--------|---------|
| `400` | Validation / upload error |
| `401` | Missing / invalid access token (status endpoints) |
| `403` | Authenticated but not authorized as admin (status endpoint) |
| `404` | Dataset not found |
| `413` | File exceeds the size limit |
| `500` | Internal server error |

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/datasets/upload` | Upload and parse a CSV file |
| `POST` | `/api/v1/datasets` | Create a dataset from uploaded CSV |
| `GET` | `/api/v1/datasets` | List dataset metadata (paginated) |
| `GET` | `/api/v1/datasets/:id` | Get a dataset with its row data |
| `PATCH` | `/api/v1/datasets/:id/status` | Approve or reject a dataset (admin only) |

---

## Frontend Integration Notes

1. **Upload first, then create** — the two-step flow is: upload the CSV to get a `fileKey`, then send the dataset metadata along with that `fileKey` to create the record.
2. Send the upload as `multipart/form-data` with the field key `file`.
3. Render the preview table header from `columns[].name`.
4. Use `validCount` / `wrongCount` to show feedback after upload.
5. Use `results` for clean table data and `wrongData` for error display — each entry has `rowNumber` (CSV line, header = 1) plus the offending `row` and per-field `errors`.
6. Row values from upload are strings; after creation, `dataset_rows` stores them with proper types.
7. The `visualizationConfig` shape must match the `templateType` — the server cross-validates this.
8. Use `GET /datasets` (with `page`/`limit`/`domain`/`status`/`search`) to populate dataset cards or filter lists — each item has an `id` field.
9. Use `GET /datasets/:id` to fetch the row data for rendering charts — `rows[].data` already has typed values (numbers/dates) ready for charting.
10. Use `PATCH /datasets/:id/status` for the approve/reject workflow — the browser must send the admin's `accessToken` cookie; rejection requires a `rejectionReason`.
