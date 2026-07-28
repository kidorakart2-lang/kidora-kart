# MongoDB Text Search Setup

The product search system uses MongoDB's **`$text`** index for fast, relevance-ranked full-text search across product names, descriptions, and tags.

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

## Automatic Index Creation

When Mongoose syncs schemas to MongoDB (i.e., when the Node.js server starts), the text index is **automatically created** if it doesn't exist. Mongoose calls `createIndex()` on every schema index during the initial connection.

**No manual setup is required** for the index to exist on first deploy — Mongoose handles it.

However, if you want to verify or force-create the index, use the steps below.

## Manual Setup (Optional)

### Step 1: Connect to MongoDB

```bash
# Using mongosh (MongoDB Shell)
mongosh "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>"
```

Or if running locally:
```bash
mongosh
use kidora-kart
```

### Step 2: Verify the Index Exists

```javascript
db.products.getIndexes()
```

Look for an entry like:
```json
{
  "v": 2,
  "key": {
    "_fts": "text",
    "_ftsx": 1
  },
  "name": "product_text_search",
  "weights": {
    "name": 10,
    "tags": 5,
    "shortDescription": 3,
    "description": 1
  },
  "default_language": "english",
  "language_override": "language",
  "textIndexVersion": 3
}
```

### Step 3: If the Index is Missing, Create It Manually

```javascript
db.products.createIndex(
  {
    name: "text",
    description: "text",
    shortDescription: "text",
    tags: "text",
  },
  {
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
    name: "product_text_search",
  },
);
```

### Step 4: Drop the Index (if rebuilding needed)

```javascript
db.products.dropIndex("product_text_search");
```

Then re-create with the command from Step 3, or simply restart the Node.js server and Mongoose will recreate it automatically.

## Verification Queries

Test the index is working:

```javascript
// Basic search
db.products.find(
  { $text: { $search: "wooden toy" }, deletedAt: null, status: "active" },
  { score: { $meta: "textScore" } },
).sort({ score: { $meta: "textScore" } }).limit(5);
```

```javascript
// Check if query uses the index
db.products.find(
  { $text: { $search: "wooden" } }
).explain("executionStats");
```

Look for `"stage": "TEXT"` in the `executionStats` output to confirm the index is being used.

## Important Notes

- **MongoDB allows only ONE text index per collection.** If a different text index already exists on the `products` collection, Mongoose will fail to create this one. Drop the old one first using `db.products.dropIndex("<name>")`.
- **Minimum word length:** MongoDB's text index ignores words shorter than 2 characters by default.
- **Stemming:** The index uses English stemming by default (searches for "running" also match "run").
- **Stop words:** Common English words (the, a, an, and, or, etc.) are ignored by `$text` automatically.
- **`$text` vs `$regex`:** `$text` is significantly faster for full-word search, is case-insensitive by default, and returns relevance-ranked results. Use `$text` for user-facing search and `$regex` only when you need partial/fuzzy matching (e.g., autocomplete).
