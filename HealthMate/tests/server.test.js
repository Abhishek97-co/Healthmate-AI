const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

test('GET / serves the frontend index page', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));

    const { port } = server.address();
    const response = await new Promise((resolve, reject) => {
      http.get({ hostname: '127.0.0.1', port, path: '/' }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }).on('error', reject);
    });

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /<div id="root">/i);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
});
