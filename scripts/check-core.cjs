// Local regression checks, not an application/server runtime.
// Run after exporting: node scripts/check-core.cjs
// Uses the project's TypeScript compiler; adds no dependencies or AI requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const store = new Map();
const storage = {
  getItem: async key => store.get(key) ?? null,
  setItem: async (key, value) => { store.set(key, value); },
};
const file = path.join(__dirname, '../services/estimates.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const loaded = new Module(file, module);
loaded.filename = file;
loaded.paths = Module._nodeModulePaths(path.dirname(file));
const originalRequire = loaded.require.bind(loaded);
loaded.require = name => name === '@react-native-async-storage/async-storage' ? storage : originalRequire(name);
loaded._compile(code, file);
const core = loaded.exports;

async function main() {
  const settings = core.defaultSettings;
  assert.equal(core.decimalNumber('1,5'), 1.5);
  assert.equal(core.decimalNumber('100.50'), 100.5);
  assert.equal(core.decimalNumber('1 250,50'), 1250.5);
  assert.equal(core.decimalNumber(''), null);
  assert.equal(core.decimalNumber('12..5'), null);
  assert.equal(core.decimalNumber('Infinity'), null);
  assert.equal(core.sellingPrice(100, 25), 125);
  assert.equal(core.sellingPrice(100.5, 25), 125.63);
  const work = core.parseDescription('Wymiana oleju, 1.5 godziny robocizny, stawka 150 zł. Olej, cena zakupu 100,50 zł.', settings);
  assert.equal(work.length, 2);
  assert.equal(work[0].category, 'labor');
  assert.equal(work[0].quantity, 1.5);
  assert.equal(work[0].unitPrice, 150);
  assert.equal(work[1].purchasePrice, 100.5);
  assert.equal(work[1].unitPrice, 125.63);
  assert.equal(core.total(work), 350.63);
  const pieces = core.parseDescription('Klocki, 2 szt., cena 90 zł; Płyn hamulcowy, zakup 20 zł', settings);
  assert.equal(pieces.length, 2);
  assert.equal(pieces[0].quantity, 2);
  assert.equal(pieces[0].unitPrice, 90);
  assert.equal(pieces[1].category, 'materials');
  assert.equal(core.parseDescription('Wymiana płynu, 1 godzina robocizny', settings)[0].category, 'labor');
  assert.equal(core.parseDescription('Przegląd Octavii, wymiana klocków', settings).length, 2);
  assert.equal(core.parseDescription('Łożysko', settings)[0].unitPrice, 0);
  assert.equal(core.itemValidationError(work), '');
  assert.notEqual(core.itemValidationError([]), '');
  assert.notEqual(core.itemValidationError([{ ...work[0], quantity: Infinity }]), '');
  assert.notEqual(core.itemValidationError([{ ...work[0], unitPrice: 0 }]), '');
  assert.notEqual(core.itemValidationError([{ ...work[0], markup: -1 }]), '');
  const rounded = [{ ...work[0], quantity: 1.5, unitPrice: 0.01 }, { ...work[0], id: 'other', quantity: 1.5, unitPrice: 0.01 }];
  assert.equal(core.total(rounded), 0.04);
  assert.equal(core.total(rounded), rounded.reduce((sum, item) => sum + core.lineTotal(item), 0));
  const empty = await core.loadData();
  assert.deepEqual(empty.estimates, []);
  const estimate = { id: 'test', number: 'TEST/1', createdAt: new Date().toISOString(), vehicleType: 'car', vehicle: 'Octavia', plate: 'WWA12345', phone: '', transcript: '', items: work, workshop: settings };
  await core.saveData({ estimates: [estimate], settings });
  assert.deepEqual((await core.loadData()).estimates[0], estimate);
  const key = 'uczciwy-kosztorys-v1';
  for (const raw of ['null', '{bad json', JSON.stringify({ estimates: [null], settings })]) {
    store.set(key, raw);
    await assert.rejects(core.loadData());
    assert.equal(store.get(key), raw, 'Loading must not overwrite unreadable history');
  }
  console.log('OK: parsing, decimal inputs, pricing, rounding, validation and storage checks.');
  console.log('These checks do not verify React UI, native speech or Android/iOS compilation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
