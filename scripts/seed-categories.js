/**
 * Seed Categories Script
 *
 * Populates the category → sub-category → sub-sub-category hierarchy
 * into the database via the admin API endpoints.
 *
 * Usage:
 *   1. Ensure the API server is running on http://localhost:5000
 *   2. node scripts/seed-categories.js
 */

const API_BASE = process.env.API_URL || "http://localhost:5000";

// ─── Credentials ─────────────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "bluehawk1711@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234567890";

// Placeholder image for sub-categories & sub-sub-categories
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/f0f0f0/333?text=Toy";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toFormData(obj) {
  const fd = new FormData();
  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) fd.append(key, String(item));
    } else {
      fd.append(key, String(val ?? ""));
    }
  }
  return fd;
}

let token = null;

function headers(extra = {}) {
  const h = { ...extra };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiPost(path, body, isFormData = false) {
  const h = headers();
  if (!isFormData) h["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: h,
    body: isFormData ? body : JSON.stringify(body),
  });
  return { json: await res.json(), headers: res.headers };
}

async function apiPostForm(path, data) {
  return apiPost(path, toFormData(data), true);
}

// ─── Login ───────────────────────────────────────────────────────────────────
async function login() {
  console.log("🔐 Logging in as", ADMIN_EMAIL);
  const { json, headers: respHeaders } = await apiPost("/api/admin/user/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!json._status) {
    console.error("❌ Login failed:", json._message);
    process.exit(1);
  }
  // Token is returned as a Set-Cookie header, not in the JSON body.
  const setCookie = respHeaders.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/adminToken=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }
  if (!token) {
    token = json.token || json._data?.token;
  }
  if (!token) {
    console.error("❌ No token found in Set-Cookie header or response body.");
    process.exit(1);
  }
  console.log("✅ Logged in successfully");
}

// ─── Safe create (skip on duplicate) ─────────────────────────────────────────
async function createCategory(name, order) {
  console.log(`  📁 Creating category: ${name}`);
  const { json } = await apiPostForm("/api/admin/category/create", { name, order, status: "true" });
  if (json._status) {
    console.log(`    ✅ Created: ${name} (slug: ${json._data?.slug})`);
    return json._data;
  }
  const msg = Array.isArray(json._message) ? json._message.join("; ") : json._message;
  if (msg && (msg.includes("duplicate") || msg.includes("already") || msg.includes("E11000"))) {
    console.log(`    ⚠️  Already exists: ${name}`);
    return null;
  }
  console.error(`    ❌ Failed: ${name} — ${msg}`);
  return null;
}

async function createSubCategory(name, categoryIds, order) {
  console.log(`  📁 Creating sub-category: ${name}`);
  const { json } = await apiPostForm("/api/admin/subcategory/create", {
    name, category: categoryIds, order, status: "true", image: PLACEHOLDER_IMAGE,
  });
  if (json._status) {
    console.log(`    ✅ Created: ${name}`);
    return json._data;
  }
  const msg = Array.isArray(json._message) ? json._message.join("; ") : json._message;
  if (msg && (msg.includes("duplicate") || msg.includes("already") || msg.includes("E11000"))) {
    console.log(`    ⚠️  Already exists: ${name}`);
    return null;
  }
  console.error(`    ❌ Failed: ${name} — ${msg}`);
  return null;
}

async function createSubSubCategory(name, subCategoryIds, order) {
  console.log(`  📁 Creating sub-sub-category: ${name}`);
  const { json } = await apiPostForm("/api/admin/subsubcategory/create", {
    name, subCategory: subCategoryIds, order, status: "true", image: PLACEHOLDER_IMAGE,
  });
  if (json._status) {
    console.log(`    ✅ Created: ${name}`);
    return json._data;
  }
  const msg = Array.isArray(json._message) ? json._message.join("; ") : json._message;
  if (msg && (msg.includes("duplicate") || msg.includes("already") || msg.includes("E11000"))) {
    console.log(`    ⚠️  Already exists: ${name}`);
    return null;
  }
  console.error(`    ❌ Failed: ${name} — ${msg}`);
  return null;
}

async function fetchCategories() {
  const { json } = await apiPost("/api/admin/category/view", {});
  return json._status ? json._data : [];
}

async function fetchSubCategories() {
  const { json } = await apiPost("/api/admin/subcategory/view", {});
  return json._status ? json._data : [];
}

async function fetchSubSubCategories() {
  const { json } = await apiPost("/api/admin/subsubcategory/view", {});
  return json._status ? json._data : [];
}

// ─── Build name→ID map from fetched records ─────────────────────────────────
function buildNameIdMap(records) {
  const map = {};
  for (const r of records) {
    map[r.name] = r._id;
  }
  return map;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Soft Toys & Dolls", order: 1 },
  { name: "Educational Toys", order: 2 },
  { name: "Action Figures & Playsets", order: 3 },
  { name: "Outdoor & Sports", order: 4 },
  { name: "Arts & Crafts", order: 5 },
  { name: "Board Games & Puzzles", order: 6 },
];

// Sub-categories keyed by PARENT CATEGORY NAME (not slug)
const SUBCATEGORIES = {
  "Soft Toys & Dolls": [
    { name: "Teddy Bears", order: 1 },
    { name: "Character Plush", order: 2 },
    { name: "Baby Dolls", order: 3 },
    { name: "Puppets", order: 4 },
  ],
  "Educational Toys": [
    { name: "STEM Kits", order: 1 },
    { name: "Puzzles", order: 2 },
    { name: "Flash Cards & Books", order: 3 },
    { name: "Math & Logic Games", order: 4 },
  ],
  "Action Figures & Playsets": [
    { name: "Superhero Figures", order: 1 },
    { name: "Building Sets", order: 2 },
    { name: "Vehicle Playsets", order: 3 },
  ],
  "Outdoor & Sports": [
    { name: "Sports Equipment", order: 1 },
    { name: "Water Toys", order: 2 },
    { name: "Ride-Ons", order: 3 },
    { name: "Play Tents & Tunnels", order: 4 },
  ],
  "Arts & Crafts": [
    { name: "Drawing & Coloring", order: 1 },
    { name: "Clay & Modeling", order: 2 },
    { name: "DIY Craft Kits", order: 3 },
    { name: "Painting Sets", order: 4 },
  ],
  "Board Games & Puzzles": [
    { name: "Family Board Games", order: 1 },
    { name: "Card Games", order: 2 },
    { name: "Jigsaw Puzzles", order: 3 },
  ],
};

// Sub-sub-categories keyed by PARENT SUB-CATEGORY NAME
const SUBSUBCATEGORIES = {
  "Puzzles": [
    { name: "Wooden Puzzles", order: 1 },
    { name: "Floor Puzzles", order: 2 },
    { name: "3D Puzzles", order: 3 },
    { name: "Alphabet & Number Puzzles", order: 4 },
  ],
  "Superhero Figures": [
    { name: "Marvel Action Figures", order: 1 },
    { name: "DC Action Figures", order: 2 },
    { name: "Movie Character Figures", order: 3 },
  ],
  "Building Sets": [
    { name: "Classic Building Blocks", order: 1 },
    { name: "Magnetic Building Sets", order: 2 },
    { name: "Construction Fort Kits", order: 3 },
  ],
  "Sports Equipment": [
    { name: "Cricket Sets", order: 1 },
    { name: "Football & Soccer", order: 2 },
    { name: "Basketball Sets", order: 3 },
  ],
  "Family Board Games": [
    { name: "Classic Board Games", order: 1 },
    { name: "Educational Board Games", order: 2 },
    { name: "Party Games", order: 3 },
  ],
  "Card Games": [
    { name: "Memory Card Games", order: 1 },
    { name: "Matching Games", order: 2 },
    { name: "UNO & Party Card Games", order: 3 },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("  Kidora Kart — Category Seeder");
  console.log("=".repeat(60) + "\n");

  await login();
  console.log();

  // 1. Create categories (rely on API slug generation)
  console.log("📦 Creating top-level categories...");
  for (const cat of CATEGORIES) {
    await createCategory(cat.name, cat.order);
  }

  // 2. Fetch categories → build name→ID map
  console.log("\n🔍 Mapping category IDs by name...");
  const allCategories = await fetchCategories();
  const catNameToId = buildNameIdMap(allCategories);
  console.log(`   Found ${allCategories.length} categories`);

  // 3. Create sub-categories (referencing parent by name)
  console.log("\n📦 Creating sub-categories...");
  for (const [parentName, subs] of Object.entries(SUBCATEGORIES)) {
    const parentId = catNameToId[parentName];
    if (!parentId) {
      console.warn(`   ⚠️  Parent category "${parentName}" not found — skipping ${subs.length} sub-categories`);
      continue;
    }
    for (const sub of subs) {
      await createSubCategory(sub.name, [parentId], sub.order);
    }
  }

  // 4. Fetch sub-categories → build name→ID map
  console.log("\n🔍 Mapping sub-category IDs by name...");
  const allSubCategories = await fetchSubCategories();
  const subCatNameToId = buildNameIdMap(allSubCategories);
  console.log(`   Found ${allSubCategories.length} sub-categories`);

  // 5. Create sub-sub-categories (referencing parent by name)
  console.log("\n📦 Creating sub-sub-categories...");
  let subSubCount = 0;
  for (const [parentName, subs] of Object.entries(SUBSUBCATEGORIES)) {
    const parentId = subCatNameToId[parentName];
    if (!parentId) {
      console.warn(`   ⚠️  Parent sub-category "${parentName}" not found — skipping ${subs.length} sub-sub-categories`);
      continue;
    }
    for (const sub of subs) {
      const result = await createSubSubCategory(sub.name, [parentId], sub.order);
      if (result) subSubCount++;
    }
  }

  // 6. Fetch sub-sub-categories for final count
  console.log("\n🔍 Fetching sub-sub-categories...");
  const allSubSubCategories = await fetchSubSubCategories();
  console.log(`   Found ${allSubSubCategories.length} sub-sub-categories`);

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("  ✅ Seeding Complete!");
  console.log("=".repeat(60));
  console.log(`  Categories (total):         ${allCategories.length}`);
  console.log(`  Sub-categories (total):     ${allSubCategories.length}`);
  console.log(`  Sub-sub-categories (total): ${allSubSubCategories.length}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});
