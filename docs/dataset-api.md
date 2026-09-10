# Dataset Module API

Base URL: `/api/v1/datasets`

---

## 1. Upload CSV Dataset

```
POST /api/v1/datasets
```

Uploads a CSV file, parses it, and returns the parsed rows, detected columns, and row count.

**Auth Required:** None (currently the route is not guarded by `authenticate` / `authorize`)

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

> On upload, the file is written to disk under `uploads/{fieldname}-{hex}.csv`, then streamed and parsed row-by-row using `csv-parser`.

**Example Request (cURL):**

```bash
curl -X POST http://localhost:3000/api/v1/datasets \
  -F "file=@./population.csv"
```

**Sample CSV (`population.csv`):**

```csv
state,value
Rajasthan,24500
Gujarat,18200
Maharashtra,31000
Uttar Pradesh,28000
Karnataka,15000
```

**Response (200) — all rows valid:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dataset uploaded successfully",
  "data": {
    "results": [
      { "state": "Rajasthan", "value": "24500" },
      { "state": "Gujarat", "value": "18200" },
      { "state": "Maharashtra", "value": "31000" },
      { "state": "Uttar Pradesh", "value": "28000" },
      { "state": "Karnataka", "value": "15000" }
    ],
    "wrongData": [],
    "columns": [
      { "name": "state", "type": "STRING" },
      { "name": "value", "type": "NUMBER" }
    ],
    "rowCount": 5,
    "validCount": 5,
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
    "results": [
      { "latitude": "23.7337", "longitude": "69.8597", "value": "85" },
      { "latitude": "8.7139", "longitude": "77.7567", "value": "95" },
      { "latitude": "24.476", "longitude": "74.862", "value": "75" },
      { "latitude": "13.3379", "longitude": "77.101", "value": "60" }
    ],
    "wrongData": [
      {
        "rowNumber": 2,
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
| `results` | array | **Valid** rows only; malformed rows are filtered out |
| `wrongData` | array | Malformed rows, each `{ rowNumber, row, errors }` — `rowNumber` is the 1-based line in the CSV file (header is row 1), `row` is the original data, `errors` lists `{ field, message }` per problem found |
| `columns` | array | Detected columns, each `{ name, type }` where `type` is inferred server-side |
| `rowCount` | number | Total data rows parsed (header row excluded) |
| `validCount` | number | Number of valid rows in `results` |
| `wrongCount` | number | Number of malformed rows in `wrongData` |

**Row validation rules:**

A row is considered malformed and moved to `wrongData` if it hits **any** of these:

| Rule | Error example |
|------|---------------|
| Any column value is empty / blank | `Value for "value" cannot be empty` |
| Value does not match its column type (`NUMBER` column with non-numeric value) | `Value for "value" must be a number` |
| Value does not match its column type (`DATE` column with non-date value) | `Value for "value" must be a valid date` |

**Column Type Inference:**

For every column, the server collects all non-empty row values and infers its type:

| Rule | Inferred `type` |
|------|-----------------|
| Column is empty (all values blank) | `STRING` |
| ≥ 80% of values are numeric | `NUMBER` |
| ≥ 80% of values parse as a date | `DATE` |
| Anything else | `STRING` |

Available types: `STRING` \| `NUMBER` \| `DATE`

> **Note:** `results` row values are always returned as **strings**; the inferred type of each column is available in `columns[].type`.

**Error (400) — no file sent:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "CSV file is not uploaded",
  "errors": []
}
```

**Error (400) — empty/invalid CSV:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "CSV file is empty or invalid",
  "errors": []
}
```

**Error (400) — parse failure:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Failed to upload dataset: <error details>",
  "errors": []
}
```

**Error (400) — unsupported file type (from Multer):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Only CSV files are allowed",
  "errors": []
}
```

**Error (413) — file exceeds size limit (from Multer):**

```json
{
  "success": false,
  "statusCode": 413,
  "message": "File too large",
  "errors": []
}
```

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
| `400` | Validation / upload error (missing file, empty CSV, wrong MIME type) |
| `413` | File exceeds the size limit |
| `500` | Internal server error while parsing |

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/datasets` | Upload and parse a CSV file |

---

## Frontend Integration Notes

- Send as `multipart/form-data` with the field key exactly `file`.
- The browser `File` object can be passed directly to `FormData`.
- Render the preview table header from `columns[].name` (the type is already inferred for you in `columns[].type`).
- Use `validCount` / `wrongCount` to show "4 rows valid, 1 row invalid" feedback after upload.
- Use `results` for the clean table data and `wrongData` for the error list — each entry has `rowNumber`
  (the exact CSV line, header = 1) plus the offending `row` and per-field `errors` you can display
  e.g. "Row 2: value cannot be empty".
- Row values are still strings; cast them using `columns[].type` before charting
  (e.g. `type === "NUMBER" ? Number(row.value) : row.value`).
- If the CSV has no header row or is empty, check for the `"CSV file is empty or invalid"` error.