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
// Size-aware queries ("1 tee" → only 1-inch tees) are also supported.

export interface SearchableProduct {
  id: string;
  name: string;
  category?: string;
  /** SKU / barcode / HSN / SAC — any textual code that should be searchable */
  code?: string;
  sku?: string;
  hsn?: string;
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

/** Parse a size from a product's name first, then its code / SKU / HSN. */
export function extractProductSize(p: SearchableProduct): number | null {
  return extractSizeInches(p.name) ?? extractSizeInches(p.code ?? p.sku ?? p.hsn ?? '');
}

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

export interface SizeQueryResult {
  /** Parsed size in inches, or null when the query carries no size. */
  size: number | null;
  /** The remaining query text with the size token removed, for scoring. */
  term: string;
}

/** Pull a size out of a search query, e.g. "1 tee" → { size: 1, term: "tee" }. */
export function extractSizeQuery(rawQuery: string): SizeQueryResult {
  const q = normalizeTerm(rawQuery);
  if (!q) return { size: null, term: '' };

  // whole + fraction: "1 1/4 elbow", "1-1/2 tee"
  let m = q.match(/\b(\d+)\s*[-/]?\s*(\d+)\s*\/\s*(\d+)\b/);
  if (m) {
    const den = parseInt(m[3], 10);
    if (den > 0) {
      const size = parseInt(m[1], 10) + parseInt(m[2], 10) / den;
      return { size, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  // fraction: "3/4 tee", "11/2 elbow"
  m = q.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den > 0) {
      const size = m[1] === '11' && (den === 2 || den === 4 || den === 8) ? 1 + 1 / den : num / den;
      return { size, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  // plain number: "1 tee", "1.5 elbow" (optionally followed by inch markers)
  m = q.match(/\b(\d+(?:\.\d+)?)\s*(?:inches|inch|\bin\b|")?\b/);
  if (m && m[1] !== undefined) {
    const v = parseFloat(m[1]);
    if (v > 0 && v <= 4) {
      return { size: v, term: q.replace(m[0], ' ').replace(/\s+/g, ' ').trim() };
    }
  }

  return { size: null, term: q };
}

/** Sort a list by parsed size ascending (3/4", 1", 1 1/4", …); unsized products last. */
function sortBySizeAsc<T extends SearchableProduct>(list: T[]): T[] {
  const sized = list.filter((p) => extractProductSize(p) !== null);
  const unsized = list.filter((p) => extractProductSize(p) === null);
  sized.sort((a, b) => (extractProductSize(a)! - extractProductSize(b)!));
  return [...sized, ...unsized];
}

export function scoreProduct(p: SearchableProduct, q: string): number {
  const nLow = p.name.toLowerCase();
  const cLow = (p.category ?? '').toLowerCase();
  const codeLow = (p.code ?? p.sku ?? p.hsn ?? '').toLowerCase();

  if (!q) return 0;

  // Exact / prefix name match
  if (nLow === q) return 120;
  if (nLow.startsWith(q)) return 90;

  let score = 0;

  // Word-boundary match ("bas" → matches "Basmati Rice")
  if (new RegExp(`\\b${escapeRegex(q)}\\b`, 'i').test(p.name)) score = 70;
  // Plain substring fallback
  else if (nLow.includes(q)) score = 50;

  // Code matches — SKU / HSN / SAC / barcode get high priority
  if (codeLow) {
    if (codeLow === q) score = Math.max(score, 110);
    else if (codeLow.startsWith(q)) score = Math.max(score, 95);
    else if (codeLow.includes(q)) score = Math.max(score, 60);
  }

  // Category match
  if (cLow.includes(q)) score = Math.max(score, 40);

  // Subsequence match ("btr" → "Butter")
  if (!score) {
    let ci = 0;
    for (let i = 0; i < nLow.length && ci < q.length; i++) {
      if (nLow[i] === q[ci]) ci++;
    }
    if (ci === q.length) score = 30;
  }

  // Fraction support: "1/2" matches fractional product names
  if (q.includes('/')) {
    const segments = q.split('/').map((s) => s.trim()).filter(Boolean);
    const matchedSegments = segments.filter((seg) => nLow.includes(seg)).length;
    if (matchedSegments > 0) score += matchedSegments * 20;
    if (nLow.includes(q.replace('/', ''))) score += 15;
  }

  // Short numeric queries: "2" → matches "2X1 T-Shirt" etc.
  if (/^\d+$/.test(q) && q.length <= 2) {
    if (nLow.startsWith(q)) score = Math.max(score, 85);
    else if (nLow.includes(` ${q}`) || nLow.includes(`${q} `)) score = Math.max(score, 60);
  }

  return score;
}

export function searchProducts<T extends SearchableProduct>(
  products: T[],
  rawQuery: string,
  maxResults = 100,
  frequencyMap: Record<string, number> = {}
): T[] {
  const q = normalizeTerm(rawQuery);

  // No query → show products in size order (smallest first)
  if (!q) return sortBySizeAsc(products).slice(0, maxResults);

  // Split the query into a size requirement + remaining search term,
  // e.g. "1 tee" → size 1 inch + term "tee"; "1 1/2 elbow" → 1.5" + "elbow".
  const { size: sizeQuery, term } = extractSizeQuery(rawQuery);

  const scored: { product: T; score: number; size: number | null }[] = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    // Score against both the full query and the size-stripped term so
    // "1 tee" still matches a product named "Tee 1 inch".
    const s = Math.max(scoreProduct(product, q), term ? scoreProduct(product, term) : 0);
    if (s <= 0) continue;

    const productSize = extractProductSize(product);
    // "1 tee" must only match 1-inch tees; "1/2 elbow" only 1/2-inch elbows.
    // Products without a parseable size are excluded too — the user asked for
    // a specific size.
    if (sizeQuery !== null && (productSize === null || Math.abs(productSize - sizeQuery) > 1e-9)) {
      continue;
    }

    const freq = frequencyMap[product.id] ?? 0;
    const freqBoost = Math.min(freq * 15, 60); // silently prefer products the user already stocked
    scored.push({ product, score: s + freqBoost, size: productSize });
    // Early exit once we have enough candidates well past the display cap
    if (scored.length > 200 && i > products.length / 2) break;
  }

  return scored
    .sort((a, b) => {
      // Size-wise ordering dominates: 3/4, 1, 1 1/4, 1 1/2, 2, 3, 4 …
      if (a.size !== null && b.size !== null && a.size !== b.size) return a.size - b.size;
      if (a.size !== null && b.size === null) return -1;
      if (a.size === null && b.size !== null) return 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.length - b.product.name.length;
    })
    .map((entry) => entry.product)
    .slice(0, maxResults);
}
