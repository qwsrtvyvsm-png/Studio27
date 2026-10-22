/* Minimal static file server for local preview, used by .claude/launch.json.
   Paths are resolved from __dirname (not process.cwd()) so it works even
   when the process is spawned with a working directory the OS sandbox
   won't let Node call getcwd() on. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8099;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

http
  .createServer((req, res) => {
    const reqPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, reqPath === '/' ? '/index.html' : reqPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (!path.extname(filePath)) {
          return fs.readFile(filePath + '.html', (err2, data2) => {
            if (err2) return notFound(res);
            res.writeHead(200, { 'Content-Type': TYPES['.html'] });
            res.end(data2);
          });
        }
        return notFound(res);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Static preview server listening on port ${PORT}`));

function notFound(res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, data) => {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(err ? 'Not found' : data);
  });
}
