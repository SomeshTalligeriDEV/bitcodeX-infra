#!/usr/bin/env bash
# One-time setup of a Render deployment, run from your machine (Render's free plan has
# no shell or jobs). Creates the two key share node databases and runs the self-host
# bootstrap (registers the nodes, creates your first app). Safe to re-run.
#
#   BITCODEX_DATABASE_URL='<External Database URL from Render>' \
#   BITCODEX_API_URL=https://bitcodex-api.onrender.com \
#   BITCODEX_KSN_PUBLIC_URLS=https://bitcodex-ksn1.onrender.com,https://bitcodex-ksn2.onrender.com \
#   BITCODEX_APP_ORIGINS=https://your-app.example \
#   scripts/render_bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${BITCODEX_DATABASE_URL:?set BITCODEX_DATABASE_URL (Render → bitcodex-db → External Database URL)}"
: "${BITCODEX_API_URL:?set BITCODEX_API_URL}"
: "${BITCODEX_KSN_PUBLIC_URLS:?set BITCODEX_KSN_PUBLIC_URLS}"

echo "Waiting for the API (it creates the tables on first start)…"
for _ in $(seq 1 60); do
  curl -fsS -m 30 "$BITCODEX_API_URL/" >/dev/null 2>&1 && break
  sleep 10
done
curl -fsS -m 30 "$BITCODEX_API_URL/" >/dev/null || { echo "API is not up at $BITCODEX_API_URL"; exit 1; }

eval "$(node -e '
const u = new URL(process.env.BITCODEX_DATABASE_URL);
const q = (s) => `'"'"'${decodeURIComponent(s).replace(/'"'"'/g, "'"'"'\\'"'"''"'"'")}'"'"'`;
console.log(`export DB_HOST=${q(u.hostname)} DB_PORT=${q(u.port || "5432")} DB_USER=${q(u.username)} DB_PASSWORD=${q(u.password)} DB_NAME=${q(u.pathname.slice(1))} DB_SSL=true`);
')"

cd backend/bitcodex_api/server
node -e '
const pg = require("pg");
(async () => {
  const c = new pg.Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false } });
  await c.connect();
  for (const db of ["bitcodex_ksn1", "bitcodex_ksn2"]) {
    const r = await c.query("SELECT 1 FROM pg_database WHERE datname = $1", [db]);
    if (r.rowCount === 0) { await c.query(`CREATE DATABASE ${db}`); console.log(`created ${db}`); }
    else console.log(`${db} exists`);
  }
  await c.end();
})().catch((e) => { console.error(`database setup failed: ${e.message}`); process.exit(1); });
'
BITCODEX_NETWORK=bittensor:testnet corepack yarn tsx src/bin/bootstrap_selfhost.ts
echo
echo "Now restart bitcodex-ksn1 and bitcodex-ksn2 in Render (Manual Deploy → Restart) so they pick up their databases."
