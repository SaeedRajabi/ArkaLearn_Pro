
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(port, hostname, (err) => {
      if (err) throw err;
      const baseUrl = dev ? `http://localhost:${port}` : `http://${hostname}:${port}`;
      console.log(`> Ready on ${baseUrl}`);
    });

    const shutdown = (signal) => {
      server.close(() => {
        console.log(`> ${signal} received. Server closed.`);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
