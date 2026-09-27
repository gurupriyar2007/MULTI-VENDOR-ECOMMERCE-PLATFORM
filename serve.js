const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const PUBLIC_DIRS = [
  path.join(__dirname, 'frontend'),
  __dirname
];

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let resolvedFile = null;

  // Try direct file or inside frontend folder
  for (const root of PUBLIC_DIRS) {
    const candidate = path.join(root, reqPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      resolvedFile = candidate;
      break;
    }
  }

  // Also check if request starts with /frontend
  if (!resolvedFile && reqPath.startsWith('/frontend/')) {
    const subPath = reqPath.replace('/frontend/', '');
    const candidate = path.join(__dirname, 'frontend', subPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      resolvedFile = candidate;
    }
  }

  if (!resolvedFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(resolvedFile, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Frontend server live at http://127.0.0.1:${PORT}`);
  console.log(`Also accessible at http://127.0.0.1:${PORT}/frontend/index.html`);
});
