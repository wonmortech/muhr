// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Dependency-free static server for the e2e tests. Serves site/ with the same security headers as
// production: they are read from deploy/Caddyfile, so a CSP change there is tested here too.
// Usage: node tests/serve.mjs [port]   (default 47391, or PORT)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../site/', import.meta.url)))
const PORT = Number(process.argv[2] || process.env.PORT || 47391)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.json': 'application/json'
}

// The header block of the Caddyfile: lines like  Name "value"  or  Name value.
const caddy = readFileSync(fileURLToPath(new URL('../deploy/Caddyfile', import.meta.url)), 'utf8')
const HEADERS = {}
for (const m of caddy.matchAll(/^\s*(Content-Security-Policy|Permissions-Policy|Referrer-Policy|X-Content-Type-Options|Cross-Origin-Opener-Policy)\s+"?([^"\n]+?)"?\s*$/gm)) HEADERS[m[1]] = m[2]
if (!HEADERS['Content-Security-Policy']) throw new Error('serve: no Content-Security-Policy in deploy/Caddyfile')

function inside (file) { return file === ROOT || file.startsWith(ROOT + sep) }

export function start (port = PORT) {
  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end() }
    let p
    try { p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { res.writeHead(400); return res.end() }
    if (p.includes('\0')) { res.writeHead(400); return res.end() }
    if (p.endsWith('/')) p += 'index.html'
    const file = resolve(join(ROOT, p))
    if (!inside(file)) { res.writeHead(403); return res.end() }
    let status = 200, body, type
    try {
      const s = await stat(file)
      if (!s.isFile()) throw new Error('not a file')
      body = await readFile(file); type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream'
    } catch {
      status = 404; body = await readFile(join(ROOT, '404.html')); type = TYPES['.html']
    }
    res.writeHead(status, { ...HEADERS, 'content-type': type, 'cache-control': 'no-store', 'content-length': body.length })
    res.end(req.method === 'HEAD' ? undefined : body)
  })
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().then(() => console.log(`serving site/ at http://127.0.0.1:${PORT}`))
}
