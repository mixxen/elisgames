const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 37173;
const root = __dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  if (pathname === '/') pathname = '/index.html';

  const file = path.resolve(path.join(root, pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving http://127.0.0.1:${port}/`);
  console.log(`Viewer  http://127.0.0.1:${port}/model-viewer.html`);
});
