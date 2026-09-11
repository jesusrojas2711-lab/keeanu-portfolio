import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = readFileSync(new URL(`../app/_lib/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loadedModule = { exports: {} };
  vm.runInNewContext(outputText, { module: loadedModule, exports: loadedModule.exports, URL, Response, Request, TextDecoder, Uint8Array, process,
    require(path) { if (path === 'server-only') return {}; if (path.startsWith('./')) return load(path.slice(2)); return require(path); } });
  cache.set(name, loadedModule.exports); return loadedModule.exports;
}
const { contactInput } = load('contact-validation');
const valid = { name: ' Ana ', email: 'ANA@example.com ', eventDate: '2026-10-24', phone: '+52 644 123 4567', message: 'Wedding in October', website: '', startedAt: Date.now() - 5000 };
test('contact input is trimmed and email is normalized', () => {
  const result = contactInput(valid);
  assert.equal(result.name, 'Ana'); assert.equal(result.email, 'ana@example.com');
});
test('contact input rejects unknown fields and invalid content', () => {
  for (const input of [
    { ...valid, role: 'admin' }, { ...valid, email: 'bad' }, { ...valid, message: 'short' },
    { ...valid, name: 'x'.repeat(101) }, { ...valid, startedAt: 'now' }, { ...valid, message: 'valid message\u0000' },
  ]) assert.throws(() => contactInput(input), (error) => error.status === 400);
});
