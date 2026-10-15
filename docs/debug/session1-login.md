### Сеанс 1. Логін: стан контролера після запиту до БД

Breakpoint: `server/src/controllers/auth/login.ts:22`

```ts
if (!user.checkIfPasswordMatch(password)) {
```

Request: `POST http://127.0.0.1:4000/v1/auth/login` body: `{"email":"admin@admin.com","password":"pass1"}`

Call stack at pause (top frames):

- `(anonymous)` — src/controllers/auth/login.ts
- `fulfilled` — src/controllers/auth/login.ts
- `processTicksAndRejections` — node:internal/process/task_queues

Local scope:

- `email`: "admin@admin.com"
- `password`: "pass1"
- `userRepository`: Repository

Watch expressions evaluated on the paused frame:

| Expression | Value |
|---|---|
| `req.body` | `{"email":"admin@admin.com","password":"pass1"}` |
| `email` | `"admin@admin.com"` |
| `user.id` | `1` |
| `user.username` | `"Heisenberg"` |
| `user.role` | `"ADMINISTRATOR"` |
| `user.password.slice(0, 7) + '…'` | `"$2a$08$…"` |
| `user.checkIfPasswordMatch(password)` | `true` |
| `user.checkIfPasswordMatch('wrong')` | `false` |

After resume → `HTTP 200`, Content-Type: `application/json; charset=utf-8`

```
{"message":"Token successfully created.","data":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IldhbHRlciBXaGl0ZSIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicm9sZSI6IkFETUlOSVNUUkFUT1IiLCJjcmVhdGVkX2F0IjoiMjAyNi0xMC0xNVQxMTowMzo1MC45MzJaIiwiaWF0IjoxNzkyMDY5NzkyLCJleHAiOjE3OTIwNzA2OTJ9.0Ex3oqZfMzga3ZClU03fdeghOUgC032fnM959JoCbGw"}
```

