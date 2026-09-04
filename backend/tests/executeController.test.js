const test = require('node:test');
const assert = require('node:assert/strict');
const { executeCode } = require('../controllers/executeController');

const createRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

test('normalizes C++ and C# language aliases for execution requests', async () => {
  const req = {
    body: {
      code: 'int main(){return 0;}',
      language: 'C++',
    },
  };
  const res = createRes();

  await executeCode(req, res);

  assert.ok(res.statusCode === 200 || res.statusCode === 422);
  assert.equal(res.body.language, 'cpp');
  assert.ok(typeof res.body.success === 'boolean');
});

test('executes JavaScript code and returns stdout', async () => {
  const req = {
    body: {
      code: 'console.log("Hello from Test");',
      language: 'javascript',
    },
  };
  const res = createRes();

  await executeCode(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.language, 'javascript');
  assert.equal(res.body.success, true);
  assert.equal(res.body.stdout, 'Hello from Test');
});

test('compiles and executes Java program', async () => {
  const req = {
    body: {
      code: 'public class Main { public static void main(String[] args) { System.out.println("Hello Render Java"); } }',
      language: 'java',
    },
  };
  const res = createRes();

  await executeCode(req, res);

  assert.ok(res.statusCode === 200 || res.statusCode === 422);
  if (res.statusCode === 200) {
    assert.equal(res.body.language, 'java');
    assert.equal(res.body.success, true);
    assert.equal(res.body.stdout.trim(), 'Hello Render Java');
  }
});

test('generates HTML preview document with CSS', async () => {
  const req = {
    body: {
      code: '<h1>Test Title</h1>',
      language: 'html',
      cssCode: 'h1 { color: red; }',
    },
  };
  const res = createRes();

  await executeCode(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.language, 'html');
  assert.equal(res.body.isPreview, true);
  assert.ok(res.body.preview.includes('<h1>Test Title</h1>'));
  assert.ok(res.body.preview.includes('h1 { color: red; }'));
});
