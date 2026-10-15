// Scripted debugger sessions over the Chrome DevTools Protocol — the same protocol that
// VS Code, WebStorm and chrome://inspect use. For each session: set a breakpoint in a
// TypeScript file, send an HTTP request, read the paused frame, resume, save a Markdown log.
//
// usage: 1) npm run dev:debug   (API with --inspect=127.0.0.1:9229)
//        2) npm run debug:sessions   -> docs/debug/session1-login.md, session3-…, session4-…
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const OUT = fileURLToPath(new URL('../../../docs/debug/', import.meta.url));
const API = 'http://127.0.0.1:4000/v1';
const INSPECTOR = 'http://127.0.0.1:9229';

// ---------------- CDP client ----------------
const connect = async () => {
  let targets;
  try {
    targets = await (await fetch(`${INSPECTOR}/json/list`)).json();
  } catch {
    throw new Error(`No Node.js inspector at ${INSPECTOR}. Start the API with: npm run dev:debug`);
  }
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    ws.onopen = ok;
    ws.onerror = fail;
  });
  let seq = 0;
  const pending = new Map();
  const scripts = [];
  const waiters = [];
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      const { ok, fail } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) fail(new Error(JSON.stringify(data.error)));
      else ok(data.result);
    } else if (data.method === 'Debugger.scriptParsed') {
      scripts.push(data.params);
    } else if (data.method === 'Debugger.paused') {
      waiters.splice(0).forEach((w) => w(data.params));
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const id = ++seq;
      pending.set(id, { ok, fail });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('Debugger.enable');
  await new Promise((r) => setTimeout(r, 700));
  return { ws, send, scripts, nextPause: () => new Promise((ok) => waiters.push(ok)) };
};

const toUrl = (p) => p.split(path.sep).join('/');

// ---------------- one session ----------------
const runSession = async (cdp, cfg) => {
  const { send, scripts, nextPause } = cdp;
  const script = scripts.find((s) => toUrl(decodeURIComponent(s.url)).endsWith(cfg.file));
  if (!script) throw new Error(`script ${cfg.file} is not loaded`);
  const { scriptSource } = await send('Debugger.getScriptSource', { scriptId: script.scriptId });
  const genLine = scriptSource.split('\n').findIndex((l) => l.includes(cfg.match));
  if (genLine < 0) throw new Error(`"${cfg.match}" not found in compiled ${cfg.file}`);
  const tsLines = fs.readFileSync(path.join(SRC, cfg.file), 'utf8').split(/\r?\n/);
  const tsLine = tsLines.findIndex((l) => l.includes(cfg.match)) + 1;
  const { breakpointId } = await send('Debugger.setBreakpoint', {
    location: { scriptId: script.scriptId, lineNumber: genLine },
  });

  const out = [`### ${cfg.title}`, '', `Breakpoint: \`server/src/${cfg.file}:${tsLine}\``, ''];
  out.push('```ts', tsLines[tsLine - 1].trim(), '```', '');
  const r = cfg.request;
  out.push(`Request: \`${r.method} ${r.url}\`${r.body ? ` body: \`${r.body}\`` : ''}`, '');

  const pausedP = nextPause();
  const responseP = fetch(r.url, { method: r.method, headers: r.headers, body: r.body });
  const paused = await pausedP;
  const frame = paused.callFrames[0];

  out.push('Call stack at pause (top frames):', '');
  for (const f of paused.callFrames.slice(0, cfg.stackDepth ?? 4)) {
    const s = scripts.find((x) => x.scriptId === f.location.scriptId);
    const file = s ? toUrl(decodeURIComponent(s.url)).replace(/^file:\/\/.*?\/server\//, '') : '?';
    out.push(`- \`${f.functionName || '(anonymous)'}\` — ${file}`);
  }
  out.push('');

  const local = frame.scopeChain.find((s) => s.type === 'local');
  if (local) {
    const { result } = await send('Runtime.getProperties', { objectId: local.object.objectId, ownProperties: true });
    out.push('Local scope:', '');
    for (const p of result) {
      const v = p.value;
      const shown = v?.type === 'object' ? v.className ?? v.subtype ?? 'Object' : JSON.stringify(v?.value);
      out.push(`- \`${p.name}\`: ${shown}`);
    }
    out.push('');
  }

  out.push('Watch expressions evaluated on the paused frame:', '', '| Expression | Value |', '|---|---|');
  for (const expression of cfg.expressions) {
    const { result, exceptionDetails } = await send('Debugger.evaluateOnCallFrame', {
      callFrameId: frame.callFrameId,
      expression,
      returnByValue: true,
    });
    const val = exceptionDetails
      ? `⚠ ${exceptionDetails.exception?.description?.split('\n')[0]}`
      : result.type === 'undefined'
      ? 'undefined'
      : JSON.stringify(result.value);
    out.push(`| \`${expression.replace(/\|/g, '\\|')}\` | \`${String(val).replace(/\|/g, '\\|')}\` |`);
  }
  out.push('');

  await send('Debugger.removeBreakpoint', { breakpointId });
  await send('Debugger.resume');
  const res = await responseP;
  let body = await res.text();
  if (body.length > 400) body = `${body.slice(0, 400)}… (${body.length} bytes total)`;
  out.push(`After resume → \`HTTP ${res.status}\`, Content-Type: \`${res.headers.get('content-type')}\``, '');
  out.push('```', body, '```', '');
  return out.join('\n');
};

// ---------------- helpers ----------------
const login = async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'standard@standard.com', password: 'pass1' }),
  });
  return (await res.json()).data;
};

const main = async () => {
  const cdp = await connect();
  fs.mkdirSync(OUT, { recursive: true });
  const save = (name, text) => {
    fs.writeFileSync(path.join(OUT, name), text);
    console.log(`saved docs/debug/${name}`);
  };

  save(
    'session1-login.md',
    await runSession(cdp, {
      title: 'Сеанс 1. Логін: стан контролера після запиту до БД',
      file: 'controllers/auth/login.ts',
      match: 'if (!user.checkIfPasswordMatch(password))',
      request: {
        method: 'POST',
        url: `${API}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@admin.com', password: 'pass1' }),
      },
      expressions: [
        'req.body',
        'email',
        'user.id',
        'user.username',
        'user.role',
        "user.password.slice(0, 7) + '…'",
        'user.checkIfPasswordMatch(password)',
        "user.checkIfPasswordMatch('wrong')",
      ],
    }),
  );

  // Session 2 (the bug before the fix) needs the original errorHandler, see docs/debug/session2-error-before.md.
  save(
    'session3-error-after.md',
    await runSession(cdp, {
      title: 'Сеанс 3. Той самий запит після виправлення errorHandler',
      file: 'middleware/errorHandler.ts',
      match: 'return res.status(customError.HttpStatusCode).json(body);',
      request: {
        method: 'POST',
        url: `${API}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        body: '{"email": "admin@admin.com", oops}',
      },
      stackDepth: 3,
      expressions: [
        'err.constructor.name',
        'err instanceof Error',
        'err.message',
        'err.type',
        'err.status',
        'customError.HttpStatusCode',
        'body.errorMessage',
        'body.errors',
        "req.method + ' ' + req.originalUrl",
      ],
    }),
  );

  const token = await login();
  const created = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ title: 'Задача для налагодження', status: 'IN_PROGRESS' }),
  }).then((r) => r.json());
  const id = created.data.id;
  try {
    save(
      'session4-task-update.md',
      await runSession(cdp, {
        title: 'Сеанс 4. TaskService.update: перевірка власника і бізнес-правило completedAt',
        file: 'modules/tasks/task.service.ts',
        match: 'Object.assign(task, dto);',
        request: {
          method: 'PATCH',
          url: `${API}/tasks/${id}`,
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ status: 'DONE' }),
        },
        expressions: ['user', 'id', 'dto', 'task.ownerId === user.id', 'task.status', 'task.completedAt', 'Object.keys(task.owner)'],
      }),
    );
  } finally {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: token } });
  }

  await cdp.send('Debugger.disable');
  cdp.ws.close();
};

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
