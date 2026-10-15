### Сеанс 2. Невалідний JSON: що потрапляє в errorHandler

Breakpoint: `server/src/middleware/errorHandler.ts:6`

```ts
return res.status(err.HttpStatusCode).json(err.JSON);
```

Request: `POST http://127.0.0.1:4000/v1/auth/login` body: `{"email": "admin@admin.com", oops}`

Call stack at pause (top frames):

- `errorHandler` — src/middleware/errorHandler.ts
- `handle_error` — node_modules/express/lib/router/layer.js
- `trim_prefix` — node_modules/express/lib/router/index.js

Local scope:

- `err`: SyntaxError
- `req`: IncomingMessage
- `res`: ServerResponse
- `next`: undefined

Watch expressions evaluated on the paused frame:

| Expression | Value |
|---|---|
| `err.constructor.name` | `"SyntaxError"` |
| `err instanceof Error` | `true` |
| `err.message` | `"Expected double-quoted property name in JSON at position 29 (line 1 column 30)"` |
| `err.type` | `"entity.parse.failed"` |
| `err.status` | `400` |
| `err.HttpStatusCode` | `undefined` |
| `err.JSON` | `undefined` |
| `req.method + ' ' + req.originalUrl` | `"POST /v1/auth/login"` |

After resume → `HTTP 500`, Content-Type: `text/html; charset=utf-8`

```
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>RangeError: Invalid status code: undefined<br> &nbsp; &nbsp;at ServerResponse.writeHead (node:_http_server:361:11)<br> &nbsp; &nbsp;at ServerResponse._implicitHeader (node:_http_server:347:8)<br> &nbsp; &nbsp;at ServerResponse.end (node:_http_outgoing:1123:10)<br> &nbsp; &nbsp;at ServerResponse.… (1135 bytes total)
```

