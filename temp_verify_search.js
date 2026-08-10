const fs = require('fs');
const ts = require('typescript');

const source = fs.readFileSync('src/utils/productSearch.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const Module = require('module');
const m = new Module('productSearch.js', module);
m._compile(outputText, 'productSearch.js');
const {
  searchProducts,
  getSizeInfo,
  extractAllSizes,
  extractSizeInches,
} = m.exports;

let passed = 0;
let failed = 0;
function assert(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { passed++; console.log('PASS', name); }
  else { failed++; console.log('FAIL', name, 'got', a, 'expected', e); }
}

// ─── Reducer detection: each reducer must parse as TWO sizes → sortSize null ───
const reducerCases = [
  ['1X1/2', [1, 0.5]],
  ['1X3/4', [1, 0.75]],
  ['2X3/4', [2, 0.75]],
  ['3/4X1/2', [0.75, 0.5]],
  ['1 1/2 x 3/4', [1.5, 0.75]],
  ['1-1/4 x 3/4', [1.25, 0.75]],
  ['11/4 X 3/4', [1.25, 0.75]],
  ['Reducer 1/2 x 1/2', [0.5]], // same-size reducer = single size, keeps it early
];
for (const [name, expected] of reducerCases) {
  const sizes = extractAllSizes(name);
  assert('extractAllSizes "' + name + '"', sizes, expected);
}

// ─── Catalog: singles + reducers mixed, all named "Elbow ..." ─────────────────
const products = [
  { id: 'R4', name: 'Elbow 1X1/2 GI', category: 'Fittings', code: 'ELB-R4' },
  { id: 'R3', name: 'Elbow 2X3/4 GI', category: 'Fittings', code: 'ELB-R3' },
  { id: 'S2', name: 'Elbow 3/4" GI', category: 'Fittings', code: 'ELB-075' },
  { id: 'S4', name: 'Elbow 1-1/4 GI', category: 'Fittings', code: 'ELB-125' },
  { id: 'R1', name: 'Elbow 1X3/4 GI', category: 'Fittings', code: 'ELB-R1' },
  { id: 'S5', name: 'Elbow 11/2 GI', category: 'Fittings', code: 'ELB-15' },
  { id: 'S1', name: 'Elbow 1" GI', category: 'Fittings', code: 'ELB-1' },
  { id: 'S6', name: 'Elbow 2 inch MS', category: 'Fittings', code: 'ELB-2' },
  { id: 'R2', name: 'Elbow 3/4X1/2 GI', category: 'Fittings', code: 'ELB-R2' },
  { id: 'S3', name: 'Elbow 3/4" MS', category: 'Fittings', code: 'ELB-075B' },
];

// Reducer flags
for (const p of products) {
  const info = getSizeInfo(p);
  if (p.id.startsWith('R')) {
    assert('reducer flagged: ' + p.name, info.sortSize === null, true);
  } else {
    assert('single size keeps sortSize: ' + p.name, info.sortSize !== null, true);
  }
}

// ─── Search "elbo": singles first (3/4, 1, 1 1/4, 1 1/2, 2), reducers after ───
const elbo = searchProducts(products, 'elbo').map((p) => p.id);
// Singles sorted: S2(0.75), S3(0.75), S1(1), S4(1.25), S5(1.5), S6(2)
// then reducers — all grouped after singles, ordered among themselves by score
// (ties by name length): R4="1X1/2" → R3="2X3/4" → R1="1X3/4" → R2="3/4X1/2"
assert('search elbo: singles lead, reducers after', elbo,
  ['S2', 'S3', 'S1', 'S4', 'S5', 'S6', 'R4', 'R3', 'R1', 'R2']);

// The top-visible products must be the single-size elbows exactly
assert('first 6 results are singles starting at 3/4', elbo.slice(0, 6),
  ['S2', 'S3', 'S1', 'S4', 'S5', 'S6']);

// Reducers must never appear before any single-size item
assert('no reducer before a single-size elbow', (() => {
  const ids = elbo.slice(0, 6);
  return !ids.some((id) => id.startsWith('R'));
})(), true);

// ─── No query: same rule applies ──────────────────────────────────────────────
const all = searchProducts(products, '', 100).map((p) => p.id);
assert('empty query: singles lead, reducers trailing', all,
  ['S2', 'S3', 'S1', 'S4', 'S5', 'S6', 'R4', 'R3', 'R1', 'R2']);

// ─── Query "3/4 elbo": 3/4-end elbows incl. reducers with a 3/4 end ───────────
const q34 = searchProducts(products, '3/4 elbo').map((p) => p.id);
assert('"3/4 elbo" = singles 3/4 first, then reducers with 3/4 end', q34,
  ['S2', 'S3', 'R4', 'R3', 'R1', 'R2']);

// ─── Query "1 elbo" → only elbows carrying a 1" end ───────────────────────────
const q1 = searchProducts(products, '1 elbo').map((p) => p.id);
assert('"1 elbo" matches 1" singles + 1X reducers', q1,
  ['S1', 'R4', 'R3', 'R1']);

// ─── Speed check survives the new reducer logic ───────────────────────────────
const big = [];
for (let i = 0; i < 5000; i++) {
  const kind = i % 4 === 0 ? '1X1/2' : ['3/4', '1', '1 1/4', '1 1/2', '2'][i % 5];
  big.push({ id: 'p' + i, name: 'Elbow ' + kind + ' GI', category: 'Fittings', code: 'ELB-' + i });
}
const t0 = Date.now();
for (let i = 0; i < 20; i++) searchProducts(big, 'elbo');
const elapsed = Date.now() - t0;
console.log('INFO 20 searches over 5000 products in', elapsed, 'ms');
if (elapsed < 2000) { passed++; console.log('PASS speed'); } else { failed++; console.log('FAIL speed', elapsed, 'ms'); }

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
