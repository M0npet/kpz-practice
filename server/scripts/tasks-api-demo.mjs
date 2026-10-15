// Walks through the whole /v1/tasks CRUD over HTTP and prints every request and response.
// Works the same on Windows, macOS and Linux (Node.js 18+, built-in fetch).
// usage: npm run demo:api [-- http://localhost:4000/v1]
const BASE = process.argv[2] ?? 'http://localhost:4000/v1';

const step = (text) => console.log(`\n$ ${text}`);

const call = async (method, path, { token, body } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = token;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: response.status, json, text };
};

const main = async () => {
  step(`POST ${BASE}/auth/login   (standard@standard.com / pass1)`);
  const login = await call('POST', '/auth/login', { body: { email: 'standard@standard.com', password: 'pass1' } });
  const token = login.json?.data;
  if (!token) throw new Error(`login failed: HTTP ${login.status} ${login.text}`);
  console.log(`token: ${token.slice(0, 40)}…`);

  step(`POST ${BASE}/tasks`);
  const created = await call('POST', '/tasks', {
    token,
    body: {
      title: 'Здати практику',
      description: 'Звіт + посилання на репозиторій',
      priority: 'HIGH',
      dueDate: '2026-10-31',
    },
  });
  console.log(`HTTP ${created.status}`, created.text);
  const id = created.json.data.id;

  step(`GET ${BASE}/tasks?status=TODO`);
  const list = await call('GET', '/tasks?status=TODO', { token });
  for (const task of list.json.data) console.log(`#${task.id} [${task.priority}] ${task.title}`);

  step(`GET ${BASE}/tasks/${id}`);
  const one = await call('GET', `/tasks/${id}`, { token });
  console.log(`HTTP ${one.status}`, one.text);

  step(`PATCH ${BASE}/tasks/${id}   {"status":"DONE"}`);
  const done = await call('PATCH', `/tasks/${id}`, { token, body: { status: 'DONE' } });
  console.log(`HTTP ${done.status}`, JSON.stringify({ message: done.json.message, status: done.json.data.status, completedAt: done.json.data.completedAt }));

  step(`POST ${BASE}/tasks   (invalid body)`);
  const invalid = await call('POST', '/tasks', { token, body: { title: '', status: 'WIP' } });
  console.log(`HTTP ${invalid.status}`, JSON.stringify({ errorType: invalid.json.errorType, errorsValidation: invalid.json.errorsValidation }));

  step(`DELETE ${BASE}/tasks/${id}`);
  const deleted = await call('DELETE', `/tasks/${id}`, { token });
  console.log(`HTTP ${deleted.status}`, deleted.text);

  step(`GET ${BASE}/tasks/${id}   (after delete)`);
  const gone = await call('GET', `/tasks/${id}`, { token });
  console.log(`HTTP ${gone.status}`);
};

main().catch((err) => {
  console.error(err.cause?.code === 'ECONNREFUSED' ? `API is not running at ${BASE} (npm run dev:local)` : err);
  process.exit(1);
});
