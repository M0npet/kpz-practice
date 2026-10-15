### Сеанс 3. Той самий запит після виправлення errorHandler

Breakpoint: `server/src/middleware/errorHandler.ts:28`

```ts
return res.status(customError.HttpStatusCode).json(body);
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
- `_a`: 400
- `_b`: 400
- `customError`: CustomError
- `body`: Object

Watch expressions evaluated on the paused frame:

| Expression | Value |
|---|---|
| `err.constructor.name` | `"SyntaxError"` |
| `err instanceof Error` | `true` |
| `err.message` | `"Expected double-quoted property name in JSON at position 29 (line 1 column 30)"` |
| `err.type` | `"entity.parse.failed"` |
| `err.status` | `400` |
| `customError.HttpStatusCode` | `400` |
| `body.errorMessage` | `"Invalid JSON in request body"` |
| `body.errors` | `["Expected double-quoted property name in JSON at position 29 (line 1 column 30)"]` |
| `req.method + ' ' + req.originalUrl` | `"POST /v1/auth/login"` |

After resume → `HTTP 400`, Content-Type: `application/json; charset=utf-8`

```
{"errorType":"General","errorMessage":"Invalid JSON in request body","errors":["Expected double-quoted property name in JSON at position 29 (line 1 column 30)"],"errorRaw":null,"errorsValidation":null,"stack":"CustomError: Invalid JSON in request body\n    at errorHandler (…/server/src/middleware/errorHandler.ts:16:9)\n    at Layer.handle_error (…/server/node_module… (1190 bytes total)
```

