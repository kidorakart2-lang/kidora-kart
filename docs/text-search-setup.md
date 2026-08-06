# MongoDB Text Search Setup

The product search system uses MongoDB's **`$text`** index for fast, relevance-ranked full-text search across product names, descriptions, tags, and short descriptions.

## How Search Works (Two Stages)

`getBySearch` and `getProductByFilter` (when a `searchQuery` is present) both use a shared helper `searchProductCandidates()` in `api/src/controller/web/product.controller.ts`:

1. **Stage 1 — weighted `$text` search** — fast, index-backed candidate discovery using the `product_text_search` index (name:10, tags:5, shortDescription:3, description:1). Returns the top N candidates ordered by `textScore`.
2. **Stage 2 — partial / fuzzy regex fallback** — MongoDB `$text` has **no prefix or typo support**, so for terms like `neckla` or `braclet` the regex stage kicks in. It builds word-boundary prefix regexes (`\b` + first 4 chars of each search word) and matches against `name`, `tags`, `shortDescription`, and `slug`.

All candidates from both stages are then **re-scored in JS** (`relevanceScore()`) so that:

- Exact word matches in `name` (+120) rank above `tags` (+60) above `shortDescription` (+30)
- Partial prefix matches rank lower (name +70 / tags +35 / shortDescription +15)
- Products matching **more search words** rank above single-word matches (e.g. `gold earrings` surfaces earrings, not just gold rings)
- The **final search word** (often the category term, e.g. "earrings") gets a +30 bonus when it matches the name

This removes the two biggest weaknesses of raw `$text` alone: no partial/typo tolerance, and quirky tie-breaking that could rank a single-word match above a stronger multi-word match.

## How Indexes Are Created

The text index is defined in the Mongoose schema (`api/src/models/product.ts`):

```typescript
productSchema.index(
  { name: "text", description: "text", shortDescription: "text", tags: "text" },
  {
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
    name: "product_text_search",
  },
);
```

- **Weights** control field importance: a match in `name` (weight 10) scores higher than in `description` (weight 1).
- The index is named `product_text_search` for easy management.

## ⚠️ Automatic Index Creation Does NOT Replace a Stale Index

Mongoose calls `createIndex()` on every schema index at startup — **but MongoDB allows only ONE text index per collection**. If a different (stale) text index already exists on `products` — e.g. an old `name_text_slug_text_description_text` from a previous schema — Mongoose **cannot** create `product_text_search`, and `$text` queries silently keep running against the stale flat index (no tags, no shortDescription, no relevance weighting).

This happened in production and degraded search quality (tags/shortDescription never searched; relevance ranking effectively off).

### Fix: use the migration script

`api/scripts/migrate-prod.mjs` now includes **Step 5b: `ensureTextIndex`** which detects any stale text index and (with `--fix`) drops it and creates the correct weighted `product_text_search`:

```bash
pnpm --filter api exec node scripts/migrate-prod.mjs --fix
```

### Manual fix (Optional)

```javascript
// See what text index(es) exist
db.products.getIndexes().filter(i => i.key && i.key._fts)

// Drop the stale one (only ONE text index allowed per collection)
db.products.dropIndex("<stale-text-index-name>")

// Create the correct weighted index
db.products.createIndex(
  {
    name: "text",
    tags: "text",
    shortDescription: "text",
    description: "text",
  },
  {
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
    name: "product_text_search",
  },
);
```

Then restart the Node.js server (Mongoose will keep it in sync).

## Verification Queries

Test the index is working:

```javascript
// Basic search
db.products.find(
  { $text: { $search: "gold necklace" }, deletedAt: null, status: "active" },
  { score: { $meta: "textScore" } },
).sort({ score: { $meta: "textScore" } }).limit(5);
```

```javascript
// Check if query uses the index
db.products.find(
  { $text: { $search: "gold" } }
).explain("executionStats");
```

Look for `"stage": "TEXT"` in the `executionStats` output to confirm the index is being used.

## Live API Smoke Tests

With the API running:

```bash
# Partial match (was: 0 results before the regex fallback)
curl "http://localhost:5000/api/website/product/get-by-search?search=neckla&limit=5"

# Misspelled term
curl "http://localhost:5000/api/website/product/get-by-search?search=braclet&limit=5"

# Multi-word should surface the category term first (earrings, not rings)
curl "http://localhost:5000/api/website/product/get-by-search?search=gold%20earrings&limit=5"

# Main listing path (header search → shop-by-category)
curl "http://localhost:5000/api/website/product/get-by-filter?searchQuery=necklace&limit=4"
```

## Important Notes

- **MongoDB allows only ONE text index per collection.** If a different text index already exists on the `products` collection, Mongoose cannot create the schema's weighted index — drop the old one first (or run the migration's Step 5b).
- **Minimum word length:** MongoDB's text index ignores words shorter than 2 characters by default. The regex fallback also requires a prefix of ≥ 2 chars.
- **Stemming:** The index uses English stemming by default (searches for "running" also match "run").
- **Stop words:** Common English words (the, a, an, and, or, etc.) are filtered out before both stages. Gender words (men/women/man…) are also removed in `getProductByFilter` and mapped to the matching sub-categories.
- **`$text` vs `$regex`:** `$text` is significantly faster for full-word search and returns relevance-ranked results. The regex fallback runs only when `$text` under-delivers (fewer than `limit*2` candidates), so the common path stays index-backed.
- **Performance cap:** `SEARCH_CANDIDATE_CAP = 200` bounds the candidates fetched for ranking; both stages cap at 400 docs max, so search stays fast as the catalog grows.
