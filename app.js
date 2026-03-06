// app.js
// Startup file for Plesk Node.js hosting

const http = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const dir = __dirname;

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      })
      .listen(port, hostname, () => {
        console.log(`Next server ready on http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error('Failed to start Next.js server:', err);
    process.exit(1);
  });
