### Сеанс 4. TaskService.update: перевірка власника і бізнес-правило completedAt

Breakpoint: `server/src/modules/tasks/task.service.ts:58`

```ts
Object.assign(task, dto);
```

Request: `PATCH http://127.0.0.1:4000/v1/tasks/26` body: `{"status":"DONE"}`

Call stack at pause (top frames):

- `(anonymous)` — src/modules/tasks/task.service.ts
- `fulfilled` — src/modules/tasks/task.service.ts
- `processTicksAndRejections` — node:internal/process/task_queues

Local scope:

- `task`: Task

Watch expressions evaluated on the paused frame:

| Expression | Value |
|---|---|
| `user` | `{"id":2,"name":"Jesse Pinkman","email":"standard@standard.com","role":"STANDARD","created_at":"2026-10-15T11:03:50.971Z"}` |
| `id` | `26` |
| `dto` | `{"status":"DONE"}` |
| `task.ownerId === user.id` | `true` |
| `task.status` | `"IN_PROGRESS"` |
| `task.completedAt` | `null` |
| `Object.keys(task.owner)` | `["id","email","name"]` |

After resume → `HTTP 200`, Content-Type: `application/json; charset=utf-8`

```
{"message":"Task successfully updated.","data":{"id":26,"title":"Задача для налагодження","description":null,"status":"DONE","priority":"MEDIUM","dueDate":null,"completedAt":"2026-10-15T13:17:32.421Z","createdAt":"2026-10-15T13:17:30.995Z","updatedAt":"2026-10-15T13:17:32.422Z","owner":{"id":2,"name":"Jesse Pinkman","email":"standard@standard.com"}}}
```

