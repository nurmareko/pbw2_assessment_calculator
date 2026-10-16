const test = require('node:test');
const assert = require('node:assert/strict');
const { sections, calculate, csvCell, toMarkdown } = require('./rubric.js');
const items = sections.flatMap(section => section.items);
test('Markdown exports identity, all items, partial points and unassessed entries', () => {
  const md = toMarkdown({ name: 'Siti', nim: '00123', ratings: { '1A': 0, '1B': 1 } });
  assert.ok(md.includes('Nama: Siti'));
  assert.ok(md.includes('NIM: 00123'));
  assert.ok(md.includes('Status: Sementara (2/16 dinilai)'));
  assert.ok(md.includes('| 1A | Setup Laravel | 6 | 0 — Belum paham | 0 |'));
  assert.ok(md.includes('| 1B | Migration &amp; relasi Eloquent | 7 | 1 — Paham sebagian | 3,5 |'));
  assert.ok(md.includes('| 4C | Hak akses resep | 3 | Belum dinilai | — |'));
  assert.ok(md.includes('**Total: 3,5 / 100**'));
  assert.equal(md.split('\n').filter(line => /^\| [1-4][A-E] \|/.test(line)).length, 16);
});
test('Markdown labels a completed assessment and handles blank identity', () => {
  const md = toMarkdown({ ratings: Object.fromEntries(items.map(i => [i[0], 2])) });
  assert.ok(md.includes('Nama: —'));
  assert.ok(md.includes('Status: Lengkap (16/16 dinilai)'));
  assert.ok(md.includes('**Total: 100 / 100**'));
});
test('Markdown escapes user formatting and collapses newlines', () => {
  const md = toMarkdown({ name: '<b>A</b> | *B*\n# heading', nim: '001' });
  assert.ok(md.includes('Nama: &lt;b&gt;A&lt;/b&gt; \\| \\*B\\* \\# heading'));
  assert.ok(!md.includes('<b>'));
});
test('PDF weights match all 16 items and four section totals', () => {
  assert.equal(items.length, 16);
  assert.deepEqual(sections.map(s => s.items.reduce((sum, i) => sum + i[2], 0)), [25, 25, 35, 15]);
  assert.equal(items.reduce((sum, i) => sum + i[2], 0), 100);
});
test('empty ratings remain incomplete, not assessed zeros', () => {
  assert.deepEqual(calculate({}), { total: 0, assessed: 0, covered: 0, groups: [0, 0, 0, 0], complete: false });
});
test('all full ratings yield 100; all explicit zeros are complete', () => {
  const full = calculate(Object.fromEntries(items.map(i => [i[0], 2])));
  assert.equal(full.total, 100); assert.equal(full.complete, true); assert.equal(full.covered, 100);
  const zero = calculate(Object.fromEntries(items.map(i => [i[0], 0])));
  assert.equal(zero.total, 0); assert.equal(zero.assessed, 16); assert.equal(zero.complete, true);
});
test('partial grades use exact weighted contributions without premature rounding', () => {
  assert.equal(calculate({ '1B': 1 }).total, 3.5);
  assert.equal(calculate(Object.fromEntries(items.map(i => [i[0], 1]))).total, 50);
  assert.deepEqual(calculate({ '1A': 2, '4C': 1 }).groups, [6, 0, 0, 1.5]);
});
test('invalid or unknown ratings do not count', () => {
  assert.equal(calculate({ '1A': -1, '1B': 3, '1C': '2', '1D': null, '2A': 1.5, '2B': 4, bogus: 2 }).assessed, 0);
});
test('CSV preserves commas, quotes, newlines and leading-zero identifiers', () => {
  assert.equal(csvCell('00123'), '"00123"');
  assert.equal(csvCell('A, "B"\nC'), '"A, ""B""\nC"');
  assert.equal(csvCell(null), '""');
});
test('spreadsheet formula inputs are neutralized', () => {
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1+1', '\t=1+1']) {
    assert.ok(csvCell(value).startsWith('"\''));
  }
});
