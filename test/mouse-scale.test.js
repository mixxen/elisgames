import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

(async () => {
  const server = http.createServer(async (req, res) => {
    let urlPath = req.url;
    if (urlPath === '/' || urlPath === '/index.html') {
      let html = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
      html = html.replace('https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.js', '/three.module.js');
      html = html.replace('const Input = { keys:new Set(), mouse:new Vec2(), mdown:false, rdown:false, gdown:false, special:false };',
        'const Input = { keys:new Set(), mouse:new Vec2(), mdown:false, rdown:false, gdown:false, special:false }; window.Input = Input;');
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return;
    }
    if (urlPath === '/three.module.js') {
      const js = await readFile(path.join(process.cwd(), 'node_modules/three/build/three.module.js'), 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      res.end(js);
      return;
    }
    try {
      const data = await readFile(path.join(process.cwd(), urlPath));
      if (urlPath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end('not found');
    }
  });

  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector('#btnStart');
  await page.click('#btnStart');
  await page.mouse.move(100, 50);
  await new Promise(r => setTimeout(r, 50));
  /* eslint-disable no-undef */
  const coords = await page.evaluate(() => ({ x: Input.mouse.x, y: Input.mouse.y }));
  /* eslint-enable no-undef */
  assert.equal(coords.x, 200);
  assert.equal(coords.y, 100);
  console.log('mouse scale test passed');
  await browser.close();
  server.close();
})();
