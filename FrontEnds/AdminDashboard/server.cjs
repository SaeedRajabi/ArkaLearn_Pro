/**
 * Legacy custom HTTPS wrapper — not used by `npm run dev:https` anymore.
 * Prefer: npm run dev:https (Next.js built-in --experimental-https + Turbopack).
 */
const next = require('next');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.HTTPS_PORT || 4001);
const hostname = process.env.HOSTNAME || 'localhost';
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const keyPath = path.join(__dirname, 'localhost-key.pem');
const certPath = path.join(__dirname, 'localhost.pem');
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

app
  .prepare()
  .then(() => {
    const onRequest = (req, res) => {
      const url = new URL(req.url ?? '/', `https://${req.headers.host ?? `localhost:${port}`}`);
      handle(req, res, {
        pathname: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
      });
    };

    if (hasCerts) {
      https
        .createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, onRequest)
        .listen(port, () => {
          console.log(`> Legacy custom server on https://${hostname}:${port}`);
          console.log('> For local dev, use: npm run dev:https');
        });
      return;
    }

    console.warn('> SSL certs not found. Run: npm run generate-certs');
    http.createServer(onRequest).listen(port, () => {
      console.log(`> Legacy custom server on http://${hostname}:${port}`);
      console.log('> For local dev, use: npm run dev:https');
    });
  })
  .catch((error) => {
    console.error('Failed to start legacy HTTPS server:', error);
    process.exit(1);
  });
