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

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.language, 'cpp');
  assert.ok(typeof res.body.success === 'boolean');
});

test('returns structured execution metadata for a Python program', async () => {
  const req = {
    body: {
      code: 'print("hi")',
      language: 'python',
      input: '',
    },
  };
  const res = createRes();

  await executeCode(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.success === true || res.body.success === false);
  assert.equal(typeof res.body.stdout, 'string');
  assert.equal(typeof res.body.stderr, 'string');
  assert.equal(typeof res.body.compileError, 'string');
  assert.equal(typeof res.body.runtimeError, 'string');
  assert.equal(typeof res.body.executionTime, 'string');
  assert.equal(typeof res.body.memory, 'string');
});
