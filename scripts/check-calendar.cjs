// Local checks after exporting: node scripts/check-calendar.cjs
// Does not contact Google, change user data or run a backend server.
process.env.TZ = 'Europe/Warsaw';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const file = path.join(__dirname, '../services/calendar.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(file, module);
loaded.filename = file;
loaded.paths = Module._nodeModulePaths(path.dirname(file));
let openedUrl = '';
let shouldFail = false;
const originalRequire = loaded.require.bind(loaded);
loaded.require = name => name === 'react-native' ? { Linking: { openURL: async url => {
  if (shouldFail) throw new Error('No browser');
  openedUrl = url;
} } } : originalRequire(name);
loaded._compile(code, file);
const calendar = loaded.exports;
const settings = { name: 'Warsztat', address: 'Łódź, Długa 1', phone: '', logo: '', hourlyRate: 150, markup: 25 };
const now = new Date('2029-01-01T00:00:00Z');
const draft = { ...calendar.createAppointmentDraft(settings), vehicle: 'Škoda & Toyota', plate: 'WWA 12345', date: '20.01.2030', time: '10:30', duration: 60, client: 'Łukasz', phone: '+48 500 600 700' };
async function main() {
  assert.equal(calendar.appointmentDay(1, new Date(2029, 11, 31, 12)), '01.01.2030');
  assert.deepEqual(calendar.validateAppointment(draft, now), {});
  const winterRange = calendar.appointmentRange(draft);
  assert.equal(winterRange.start.toISOString(), '2030-01-20T09:30:00.000Z');
  assert.equal(winterRange.end.toISOString(), '2030-01-20T10:30:00.000Z');
  const summerRange = calendar.appointmentRange({ ...draft, date: '20.07.2030' });
  assert.equal(summerRange.start.toISOString(), '2030-07-20T08:30:00.000Z');
  for (const date of ['31.02.2030', '29.02.2030', '00.01.2030', '01.13.2030', '2030-01-20']) {
    assert.equal(calendar.appointmentRange({ ...draft, date }), null);
    assert.ok(calendar.validateAppointment({ ...draft, date }, now).date);
  }
  assert.ok(calendar.appointmentRange({ ...draft, date: '29.02.2032' }));
  assert.equal(calendar.appointmentRange({ ...draft, date: '31.03.2030', time: '02:30' }), null);
  for (const time of ['24:00', '10:60', '9:30']) assert.ok(calendar.validateAppointment({ ...draft, time }, now).time);
  assert.ok(calendar.validateAppointment({ ...draft, date: '01.01.2028' }, now).time);
  assert.ok(calendar.validateAppointment({ ...draft, vehicle: ' ' }, now).vehicle);
  assert.ok(calendar.validateAppointment({ ...draft, duration: 0 }, now).duration);
  assert.ok(calendar.validateAppointment({ ...draft, phone: 'abc' }, now).phone);
  assert.ok(calendar.validateAppointment({ ...draft, description: 'x'.repeat(501) }, now).description);
  const midnight = calendar.appointmentRange({ ...draft, time: '23:30', duration: 120 });
  assert.equal(midnight.end.getDate(), 21);
  assert.equal(midnight.end.getHours(), 1);
  const url = new URL(calendar.buildGoogleCalendarUrl(draft, now));
  assert.equal(url.hostname, 'calendar.google.com');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('text'), 'Naprawa · Škoda & Toyota · WWA 12345');
  assert.equal(url.searchParams.get('dates'), '20300120T093000Z/20300120T103000Z');
  assert.equal(url.searchParams.get('location'), settings.address);
  assert.match(url.searchParams.get('details'), /Klient: Łukasz/);
  assert.match(url.searchParams.get('details'), /Telefon klienta: \+48 500 600 700/);
  assert.equal(url.searchParams.has('add'), false, 'No customer invitations');
  assert.throws(() => calendar.buildGoogleCalendarUrl({ ...draft, vehicle: '' }, now));
  const seeded = calendar.createAppointmentDraft(settings, { vehicle: 'Octavia', plate: 'WWA', phone: '+48 123456789', number: 'UK/1', items: [{ name: 'Wymiana oleju' }] });
  assert.equal(seeded.vehicle, 'Octavia'); assert.equal(seeded.description, 'Wymiana oleju'); assert.equal(seeded.estimateNumber, 'UK/1');
  await calendar.openGoogleCalendar({ ...draft, date: '20.01.2099' });
  assert.match(openedUrl, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  shouldFail = true;
  await assert.rejects(calendar.openGoogleCalendar({ ...draft, date: '20.01.2099' }), /Nie udało się otworzyć/);
  console.log('OK: calendar dates, validation, daylight-saving time, encoding, prefilling and browser error handling.');
  console.log('Does not verify Google UI, saving events, native linking or APK compilation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
