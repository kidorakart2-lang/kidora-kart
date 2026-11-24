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
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/fbece7/8b1e3f?text=Jewel";

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
  { name: "Earrings", order: 1 },
  { name: "Necklaces", order: 2 },
  { name: "Rings", order: 3 },
  { name: "Bangles & Bracelets", order: 4 },
  { name: "Bridal Jewellery", order: 5 },
  { name: "Anklets & Accessories", order: 6 },
];

// Sub-categories keyed by PARENT CATEGORY NAME (not slug)
const SUBCATEGORIES = {
  "Earrings": [
    { name: "Jhumkas", order: 1 },
    { name: "Studs", order: 2 },
    { name: "Hoops", order: 3 },
    { name: "Chandbali", order: 4 },
  ],
  "Necklaces": [
    { name: "Chains", order: 1 },
    { name: "Pendants", order: 2 },
    { name: "Choker Sets", order: 3 },
    { name: "Temple Necklaces", order: 4 },
  ],
  "Rings": [
    { name: "Casual Rings", order: 1 },
    { name: "Cocktail Rings", order: 2 },
    { name: "Adjustable Rings", order: 3 },
  ],
  "Bangles & Bracelets": [
    { name: "Bangles", order: 1 },
    { name: "Bracelets", order: 2 },
    { name: "Kada", order: 3 },
  ],
  "Bridal Jewellery": [
    { name: "Bridal Necklace Sets", order: 1 },
    { name: "Bridal Earring Sets", order: 2 },
    { name: "Maang Tikka", order: 3 },
    { name: "Nath", order: 4 },
  ],
  "Anklets & Accessories": [
    { name: "Anklets", order: 1 },
    { name: "Nose Pins", order: 2 },
    { name: "Hair Accessories", order: 3 },
  ],
};

// Sub-sub-categories keyed by PARENT SUB-CATEGORY NAME
const SUBSUBCATEGORIES = {
  "Jhumkas": [
    { name: "Antique Jhumkas", order: 1 },
    { name: "Pearl Jhumkas", order: 2 },
    { name: "Kundan Jhumkas", order: 3 },
  ],
  "Pendants": [
    { name: "Gold-Plated Pendants", order: 1 },
    { name: "Stone Pendants", order: 2 },
    { name: "Pearl Pendants", order: 3 },
  ],
  "Bangles": [
    { name: "Gold-Plated Bangles", order: 1 },
    { name: "Stone Bangles", order: 2 },
    { name: "Kundan Bangles", order: 3 },
  ],
  "Bridal Necklace Sets": [
    { name: "Kundan Sets", order: 1 },
    { name: "Polki Sets", order: 2 },
    { name: "Pearl Sets", order: 3 },
  ],
  "Choker Sets": [
    { name: "Kundan Chokers", order: 1 },
    { name: "Pearl Chokers", order: 2 },
    { name: "Oxidised Chokers", order: 3 },
  ],
  "Bracelets": [
    { name: "Chain Bracelets", order: 1 },
    { name: "Charm Bracelets", order: 2 },
    { name: "Stone Bracelets", order: 3 },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("  Jewel Box — Category Seeder");
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
