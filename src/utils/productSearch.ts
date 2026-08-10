// ─── Ranked product search utilities ───────────────────────────────────────────
// Used by invoice product pickers (FullScreenProductSearch, MobileInvoiceForm).
// Ranking tiers (higher = better):
//   120 exact name       110 exact code        95 code-prefix
//    90 name-prefix       85 numeric-prefix    70 word-boundary
//    60 code-substring    50 name-substring    40 category match
//    30 name subsequence  +20 per matched fraction segment
//   + (frequencyBoost up to +60 for repeat additions)
// Results are grouped and sorted by pipe size, smallest first:
//   3/4", 1", 1 1/4", 1 1/2", 2", 3", 4" …
// Reducer fittings with two sizes (e.g. "1X1/2", "2X3/4", "3/4X1/2") are kept
// AFTER all single-size items so they never jump to the top of the list.
// Size-aware queries ("1 tee" → only 1-inch tees) are also supported.

export interface SearchableProduct {
  id: string;
  name: string;
  category?: string;
  /** SKU / barcode / HSN / SAC — any textual code that should be searchable */
  code?: string;
  sku?: string;
  hsn?: string;
  /** Description / specification text — size info is often only stored here */
  description?: string;
  specification?: string;
}

export function normalizeTerm(t: string): string {
  return t.toLowerCase().replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Pipe-size parsing ────────────────────────────────────────────────────────
// Understands the notations used in fitting names and quick-search queries:
//   "3/4", "1", "1-1/4", "1 1/2", "2 inch", and the "11/4" / "11/2" shorthand
//   (used for 1 1/4" / 1 1/2").
// Also detects reducer patterns ("1X1/2", "1-1/4 x 3/4", "3/4X1/2") so
// two-size products are NOT treated as a single small size.

/** Parse a size in inches from product or query text, or null when none is found. */
export function extractSizeInches(text: string): number | null {
  const n = ` ${text.toLowerCase().replace(/,/g, ' ')} `;

  // whole + fraction: "1 1/4", "1-1/4"
  let m = n.match(/(\d+)\s*[-/]?\s*(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const den = parseInt(m[3], 10);
    if (den > 0) return parseInt(m[1], 10) + parseInt(m[2], 10) / den;
  }

  // fraction: "3/4", "1/2" — plus the "11/4" / "11/2" shorthand
  m = n.match(/(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den <= 0) return null;
    if (m[1] === '11' && (den === 2 || den === 4 || den === 8)) return 1 + 1 / den;
    return num / den;
  }

  // plain number adjacent to an inch marker: "2 inch", `1"`, "3 in"
  m = n.match(/(\d+(?:\.\d+)?)\s*(?:inches|inch|\bin\b|")/);
  if (m) {
    const v = parseFloat(m[1]);
    if (v > 0 && v <= 48) return v;
  }

  // lone number at the start or end of the text: "1 tee", "Elbow 2"
  m = n.match(/^\s*(\d+(?:\.\d+)?)\s+/) || n.match(/\s+(\d+(?:\.\d+)?)\s*$/);
  if (m && m[1] !== undefined) {
    const v = parseFloat(m[1]);
    if (v > 0 && v <= 24) return v;
  }

  return null;
}

/** Parse one dimension token ("1", "1.5", "3/4", "1-1/4", "1 1/2", "11/2") into inches. */
function parseDimensionToken(token: string): number | null {
  const t = ` ${token.trim().toLowerCase().replace(/\s+/g, ' ')} `;

  // whole + fraction: "1 1/4", "1-1/4"
  let m = t.match(/(\d+)\s*[-/]?\s*(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const den = parseInt(m[3], 10);
    if (den > 0) return parseInt(m[1], 10) + parseInt(m[2], 10) / den;
  }

  // fraction: "3/4", "1/2" — plus the "11/4" / "11/2" shorthand
  m = t.match(/(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den <= 0) return null;
    if (m[1] === '11' && (den === 2 || den === 4 || den === 8)) return 1 + 1 / den;
    return num / den;
  }

  // plain number: "1", "1.5"
  m = t.match(/(\d+(?:\.\d+)?)/);
  if (m) {
    const v = parseFloat(m[1]);
    if (v > 0 && v <= 24) return v;
  }

  return null;
}

// One size token on each side of an "x" (reducer): "1X1/2", "1 x 1 1/4", "3/4 x 3/4"…
const REDUCER_SIDE = '(\\d+(?:\\.\\d+)?(?:\\s*[-/]?\\s*\\d+(?:\\s*\\/\\s*\\d+)?)?)';
const REDUCER_RE = new RegExp(`${REDUCER_SIDE}\\s*[xX]\\s*${REDUCER_SIDE}`);

/**
 * All distinct sizes found in text.
 * Detects reducer patterns (two sizes joined by "x") and returns BOTH sizes,
 * e.g. "1X1/2" → [1, 0.5], "2X3/4" → [2, 0.75], "3/4X1/2" → [0.75, 0.5].
 */
export function extractAllSizes(text: string): number[] {
  if (!text) return [];
  let n = text.toLowerCase().replace(/,/g, ' ');
  const sizes = new Set<number>();

  const m = n.match(REDUCER_RE);
  if (m) {
    const s1 = parseDimensionToken(m[1]);
    const s2 = parseDimensionToken(m[2]);
    if (s1 !== null) sizes.add(s1);
    if (s2 !== null) sizes.add(s2);
    // Remove the matched reducer span so the generic scan doesn't re-add a half fraction.
    n = n.replace(m[0], ' ');
  }

  const rest = extractSizeInches(n);
  if (rest !== null) sizes.add(rest);

  return Array.from(sizes);
}

export interface SizeInfo {
  /** All distinct sizes found across name / code / description. */
  sizes: number[];
  /** Primary (first) size in inches, or null when none found. */
  primary: number | null;
  /**
   * Size used for ordering results. Reducers (products with two or more sizes,
   * e.g. "1X1/2", "2X3/4") return null so they sort AFTER single-size items.
   */
  sortSize: number | null;
}

/** Analyze a product's sizes across name → code/SKU/HSN → description/specification. */
export function getSizeInfo(p: SearchableProduct): SizeInfo {
  const sizes = new Set<number>();
  const addText = (t: string | undefined) => {
    if (!t) return;
    for (const s of extractAllSizes(t)) sizes.add(s);
  };
  addText(p.name);
  addText(p.code ?? p.sku ?? p.hsn ?? '');
  addText(p.description);
  addText(p.specification);

  const sizeList = Array.from(sizes);
  return {
    sizes: sizeList,
    primary: sizeList.length > 0 ? sizeList[0] : null,
    sortSize: sizeList.length === 1 ? sizeList[0] : null,
  };
}

/** Parse a size from the product's name, then code / SKU / HSN, then description / specification. */
export function extractProductSize(p: SearchableProduct): number | null {
  return getSizeInfo(p).primary;
}

export interface SizeQueryResult {
  /** Parsed size in inches, or null when the query carries no size. */
  size: number | null;
  /** The remaining query text with the size token removed, for scoring. */
  term: string;
}

const REGEX_WHOLE_FRACTION = /\b(\d+)\s*[-/]?\s*(\d+)\s*\/\s*(\d+)\b/;
const REGEX_FRACTION = /\b(\d+)\s*\/\s*(\d+)\b/;
const REGEX_PLAIN_NUMBER = /\b(\d+(?:\.\d+)?)\s*(?:inches|inch|\bin\b|")?\b/;

/** Pull a size out of a search query, e.g. "1 tee" → { size: 1, term: "tee" }. */
export function extractSizeQuery(rawQuery: string): SizeQueryResult {
  const q = normalizeTerm(rawQuery);
  if (!q) return { size: null, term: '' };

  // whole + fraction: "1 1/4 elbow", "1-1/2 tee"
  let m = q.match(REGEX_WHOLE_FRACTION);
  if (m) {
    const den = parseInt(m[3], 10);
    if (den > 0) {
      const size = parseInt(m[1], 10) + parseInt(m[2], 10) / den;
      return { size, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  // fraction: "3/4 tee", "11/2 elbow"
  m = q.match(REGEX_FRACTION);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den > 0) {
      const size = m[1] === '11' && (den === 2 || den === 4 || den === 8) ? 1 + 1 / den : num / den;
      return { size, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  // plain number: "1 tee", "1.5 elbow" (optionally followed by inch markers)
  m = q.match(REGEX_PLAIN_NUMBER);
  if (m && m[1] !== undefined) {
    const v = parseFloat(m[1]);
    if (v > 0 && v <= 4) {
      return { size: v, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  return { size: null, term: q };
}

/** Create a fast lowercase search index for a product. */
export interface SearchContext {
  nameLow: string;
  categoryLow: string;
  codeLow: string;
}

export function buildSearchContext(p: SearchableProduct): SearchContext {
  return {
    nameLow: p.name.toLowerCase(),
    categoryLow: (p.category ?? '').toLowerCase(),
    codeLow: (p.code ?? p.sku ?? p.hsn ?? '').toLowerCase(),
  };
}

export function scoreProductWithContext(
  ctx: SearchContext,
  p: SearchableProduct,
  q: string
): number {
  const { nameLow, categoryLow, codeLow } = ctx;

  if (!q) return 0;

  // Exact / prefix name match
  if (nameLow === q) return 120;
  if (nameLow.startsWith(q)) return 90;

  let score = 0;

  // Word-boundary match ("bas" → matches "Basmati Rice")
  if (new RegExp(`\\b${escapeRegex(q)}\\b`, 'i').test(p.name)) score = 70;
  // Plain substring fallback
  else if (nameLow.includes(q)) score = 50;

  // Code matches — SKU / HSN / SAC / barcode get high priority
  if (codeLow) {
    if (codeLow === q) score = Math.max(score, 110);
    else if (codeLow.startsWith(q)) score = Math.max(score, 95);
    else if (codeLow.includes(q)) score = Math.max(score, 60);
  }

  // Category match
  if (categoryLow.includes(q)) score = Math.max(score, 40);

  // Subsequence match ("btr" → "Butter")
  if (!score) {
    let ci = 0;
    for (let i = 0; i < nameLow.length && ci < q.length; i++) {
      if (nameLow[i] === q[ci]) ci++;
    }
    if (ci === q.length) score = 30;
  }

  // Fraction support: "1/2" matches fractional product names
  if (q.includes('/')) {
    const segments = q.split('/').map((s) => s.trim()).filter(Boolean);
    const matchedSegments = segments.filter((seg) => nameLow.includes(seg)).length;
    if (matchedSegments > 0) score += matchedSegments * 20;
    if (nameLow.includes(q.replace('/', ''))) score += 15;
  }

  // Short numeric queries: "2" → matches "2X1 T-Shirt" etc.
  if (/^\d+$/.test(q) && q.length <= 2) {
    if (nameLow.startsWith(q)) score = Math.max(score, 85);
    else if (nameLow.includes(` ${q}`) || nameLow.includes(`${q} `)) score = Math.max(score, 60);
  }

  return score;
}

export function scoreProduct(p: SearchableProduct, q: string): number {
  return scoreProductWithContext(buildSearchContext(p), p, q);
}

/**
 * Precompute size + lowercase text for the whole catalog once, so repeated
 * searches (keystroke-by-keystroke) don't re-parse every product.
 */
export interface SearchableProductIndex {
  /** Primary parsed size in inches (first size found), or null. */
  size: number | null;
  /** All distinct sizes found (reducers have 2+). */
  sizes: number[];
  /** Size used for ordering; null for reducers (multi-size) so they sort last. */
  sortSize: number | null;
  /** True when the product carries two or more distinct sizes (e.g. "1X1/2"). */
  isReducer: boolean;
  context: SearchContext;
}

export function indexProducts<T extends SearchableProduct>(
  products: T[]
): Map<string, SearchableProductIndex> {
  const map = new Map<string, SearchableProductIndex>();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const info = getSizeInfo(p);
    map.set(p.id, {
      size: info.primary,
      sizes: info.sizes,
      sortSize: info.sortSize,
      isReducer: info.sizes.length > 1,
      context: buildSearchContext(p),
    });
  }
  return map;
}

export function searchProducts<T extends SearchableProduct>(
  products: T[],
  rawQuery: string,
  maxResults = 100,
  frequencyMap: Record<string, number> = {}
): T[] {
  const q = normalizeTerm(rawQuery);

  // No query → show products in size order (smallest first); cache the result
  // via a WeakMap so repeated opens with the same catalog are instant.
  if (!q) {
    if (products.length <= 256) {
      const cached = sizeSortedCache.get(products);
      if (cached) return (cached as T[]).slice(0, maxResults);
    }
    const sorted = sortCatalogBySizeAsc(products).slice(0, maxResults);
    if (products.length <= 256) {
      try { sizeSortedCache.set(products, sorted); } catch { /* WeakMap key not object */ }
    }
    return sorted;
  }

  // Split the query into a size requirement + remaining search term,
  // e.g. "1 tee" → size 1 inch + term "tee"; "1 1/2 elbow" → 1.5" + "elbow".
  const { size: sizeQuery, term } = extractSizeQuery(rawQuery);

  const index = catalogIndexCache.get(products) ?? rebuildCatalogIndex(products);
  const minScore = 1;

  const scored: { product: T; score: number; sortSize: number | null }[] = [];
  const freqBoostCache = new Map<string, number>();
  const getFreq = (id: string): number => {
    const cached = freqBoostCache.get(id);
    if (cached !== undefined) return cached;
    const raw = frequencyMap[id] ?? 0;
    const boost = Math.min(raw * 15, 60);
    freqBoostCache.set(id, boost);
    return boost;
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const entry = index.get(product.id);
    if (!entry) continue;

    // Score against both the full query and the size-stripped term so
    // "1 tee" still matches a product named "Tee 1 inch".
    const s = Math.max(
      scoreProductWithContext(entry.context, product, q),
      term ? scoreProductWithContext(entry.context, product, term) : 0
    );
    if (s < minScore) continue;

    // "1 tee" must only match 1-inch tees; "3/4 reducer" must include any
    // product with a 3/4 end (e.g. "1X3/4" reducer). Products without any
    // parseable size are excluded when the user asked for a specific size.
    if (sizeQuery !== null && !entry.sizes.some((sz) => Math.abs(sz - sizeQuery) <= 1e-9)) {
      continue;
    }

    scored.push({ product, score: s + getFreq(product.id), sortSize: entry.sortSize });
    // Early exit once we have enough candidates well past the display cap
    if (scored.length > 200 && i > products.length / 2) break;
  }

  if (scored.length <= 1) return scored.slice(0, maxResults).map((e) => e.product);

  // Sort the matched subset: single-size items lead, smallest first
  // (3/4, 1, 1 1/4, 1 1/2, 2, 3, 4 …); reducers (1X1/2, 2X3/4, …) come after.
  const sorted = scored.sort((a, b) => {
    if (a.sortSize !== null && b.sortSize !== null && a.sortSize !== b.sortSize) {
      return a.sortSize - b.sortSize;
    }
    if (a.sortSize !== null && b.sortSize === null) return -1;
    if (a.sortSize === null && b.sortSize !== null) return 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.product.name.length - b.product.name.length;
  });

  return sorted
    .slice(0, maxResults)
    .map((entry) => entry.product);
}

// ─── Catalog-level caches ─────────────────────────────────────────────────────
// Keyed on the array reference so cache invalidation is automatic whenever the
// products array identity changes (products are fetched once per mount).

/** Sorted no-query result per catalog array. */
const sizeSortedCache = new WeakMap<object, unknown[]>();

/** Parsed sizes + lowered text per catalog array. */
const catalogIndexCache = new WeakMap<object, Map<string, SearchableProductIndex>>();

function rebuildCatalogIndex<T extends SearchableProduct>(
  products: T[]
): Map<string, SearchableProductIndex> {
  const index = indexProducts(products);
  catalogIndexCache.set(products, index);
  return index;
}

/** Sort the catalog by size ascending; single-size items first, reducers (2+ sizes) last. */
function sortCatalogBySizeAsc<T extends SearchableProduct>(list: T[]): T[] {
  const withInfo = list.map((p) => ({ p, info: getSizeInfo(p) }));
  const single = withInfo.filter((e) => e.info.sortSize !== null);
  const rest = withInfo.filter((e) => e.info.sortSize === null);
  single.sort((a, b) => (a.info.sortSize! - b.info.sortSize!));
  return [...single, ...rest].map((e) => e.p);
}
