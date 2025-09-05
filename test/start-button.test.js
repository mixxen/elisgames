import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

(async () => {
  const server = http.createServer(async (req, res) => {
    let urlPath = req.url;
    if (urlPath === '/' || urlPath === '/index.html') {
      const html = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
      const patched = html.replace('https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.js', '/three.module.js');
      res.setHeader('Content-Type', 'text/html');
      res.end(patched);
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
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector('#btnStart');

  // overlay visible initially
  const visible = await page.$eval('#overlay', el => !el.classList.contains('hidden'));
  assert.equal(visible, true);

  // click start button
  await page.click('#btnStart');
  await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'));
  const hidden = await page.$eval('#overlay', el => el.classList.contains('hidden'));
  assert.equal(hidden, true);

  console.log('start button test passed');

  await browser.close();
  server.close();
})();
