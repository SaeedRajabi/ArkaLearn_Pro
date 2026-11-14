/**
 * Legacy custom HTTPS wrapper — not used by `npm run dev:https` anymore.
 * Prefer: npm run dev:https (Next.js built-in --experimental-https + Turbopack).
 *
 * Kept for manual/production experiments only.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const next = require('next');
const https = require('https');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3001);
const hostname = process.env.HOSTNAME || 'localhost';
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const keyPath = path.join(__dirname, 'localhost-key.pem');
const certPath = path.join(__dirname, 'localhost.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Missing localhost-key.pem or localhost.pem. Run: npm run dev:https');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app
  .prepare()
  .then(() => {
    https
      .createServer(httpsOptions, (req, res) => {
        const url = new URL(req.url ?? '/', `https://${req.headers.host ?? `localhost:${port}`}`);
        handle(req, res, {
          pathname: url.pathname,
          query: Object.fromEntries(url.searchParams.entries()),
        });
      })
      .listen(port, () => {
        console.log(`> Legacy custom server on https://${hostname}:${port}`);
        console.log('> For local dev, use: npm run dev:https');
      });
  })
  .catch((error) => {
    console.error('Failed to start legacy HTTPS server:', error);
    process.exit(1);
  });
