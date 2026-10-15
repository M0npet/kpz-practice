#!/usr/bin/env bash
# Walks through the whole /v1/tasks CRUD with curl and prints every request/response.
# usage: ./scripts/tasks-api-demo.sh [base_url]     (default http://localhost:4000/v1)
# needs: curl and node (node only pulls fields out of JSON)
set -euo pipefail

BASE=${1:-http://localhost:4000/v1}

# json '<js expression with d = parsed body>'
json() {
  node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const d=JSON.parse(s);const v=eval(process.argv[1]);console.log(typeof v==="string"?v:JSON.stringify(v))})' "$1"
}
step() { printf '\n\033[1m$ %s\033[0m\n' "$*"; }

step "POST $BASE/auth/login   (standard@standard.com / pass1)"
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"standard@standard.com","password":"pass1"}' | json 'd.data')
echo "token: ${TOKEN:0:40}…"
AUTH=(-H "Authorization: $TOKEN")

step "POST $BASE/tasks"
CREATED=$(curl -s -X POST "$BASE/tasks" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"title":"Здати практику","description":"Звіт + посилання на репозиторій","priority":"HIGH","dueDate":"2026-10-31"}')
echo "$CREATED"
ID=$(echo "$CREATED" | json 'd.data.id')

step "GET $BASE/tasks?status=TODO"
curl -s "$BASE/tasks?status=TODO" "${AUTH[@]}" | json 'd.data.map(t => `#${t.id} [${t.priority}] ${t.title}`).join("\n")'

step "GET $BASE/tasks/$ID"
curl -s "$BASE/tasks/$ID" "${AUTH[@]}"
echo

step "PATCH $BASE/tasks/$ID   {\"status\":\"DONE\"}"
curl -s -X PATCH "$BASE/tasks/$ID" "${AUTH[@]}" -H 'Content-Type: application/json' -d '{"status":"DONE"}' \
  | json '({ message: d.message, status: d.data.status, completedAt: d.data.completedAt })'

step "POST $BASE/tasks   (invalid body)"
curl -s -X POST "$BASE/tasks" "${AUTH[@]}" -H 'Content-Type: application/json' -d '{"title":"","status":"WIP"}' \
  | json '({ errorType: d.errorType, errorsValidation: d.errorsValidation })'

step "DELETE $BASE/tasks/$ID"
curl -s -X DELETE "$BASE/tasks/$ID" "${AUTH[@]}"
echo

step "GET $BASE/tasks/$ID   (after delete)"
curl -s -o /dev/null -w 'HTTP %{http_code}\n' "$BASE/tasks/$ID" "${AUTH[@]}"
