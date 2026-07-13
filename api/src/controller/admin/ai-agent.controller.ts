import type { Request, Response } from "express";
import { streamText } from "ai";
import { z } from "zod";
import {
  resolveModel,
  listConfiguredProviders,
  type AiProviderName,
} from "../../lib/ai-providers.js";
import { logger } from "../../lib/logger.js";
import FaqModel from "../../models/faq.js";
import MaterialModel from "../../models/material.js";
import ColorModel from "../../models/color.js";
import SizeModel from "../../models/size.js";
import ProductModel from "../../models/product.js";
import CategoryModel from "../../models/category.js";
import SubCategoryModel from "../../models/subCategory.js";
import SubSubCategoryModel from "../../models/subSubCategory.js";
import BannerModel from "../../models/banner.js";
import TestimonialModel from "../../models/testimonial.js";
import WhyChooseUsModel from "../../models/whyChooseUs.js";
import CoupenModel from "../../models/coupen.js";
import AiResponse from "../../models/aiResponse.js";
import cache from "../../lib/cache.js";
/// <reference path="../../types/express.d.ts" />

// ── Schema definitions for tool arguments ──────────────────────────

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

// Common color name → hex lookup
const COLOR_NAME_HEX: Record<string, string> = {
  red: "#FF0000", "dark red": "#8B0000", "light red": "#FF7F7F", "crimson": "#DC143C",
  blue: "#0000FF", "dark blue": "#00008B", "light blue": "#ADD8E6", "sky blue": "#87CEEB", "navy": "#000080", "royal blue": "#4169E1", "baby blue": "#89CFF0",
  green: "#008000", "dark green": "#006400", "light green": "#90EE90", "lime": "#00FF00", "olive": "#808000", "emerald": "#50C878", "forest green": "#228B22",
  yellow: "#FFFF00", "light yellow": "#FFFFE0", "gold": "#FFD700", "amber": "#FFBF00",
  orange: "#FFA500", "dark orange": "#FF8C00", "light orange": "#FFD580", "coral": "#FF7F50",
  purple: "#800080", "dark purple": "#4B0082", "light purple": "#CBC3E3", "lavender": "#E6E6FA", "violet": "#8F00FF", "magenta": "#FF00FF",
  pink: "#FFC0CB", "hot pink": "#FF69B4", "light pink": "#FFB6C1", "rose": "#FF007F",
  brown: "#A52A2A", "light brown": "#D2B48C", tan: "#D2B48C", "chocolate": "#7B3F00",
  black: "#000000", white: "#FFFFFF", gray: "#808080", grey: "#808080", "light gray": "#D3D3D3", "dark gray": "#A9A9A9", silver: "#C0C0C0",
  teal: "#008080", cyan: "#00FFFF", aqua: "#00FFFF", turquoise: "#40E0D0", indigo: "#4B0082",
  maroon: "#800000", beige: "#F5F5DC", mint: "#98FF98", peach: "#FFDAB9", salmon: "#FA8072",
  khaki: "#F0E68C", plum: "#DDA0DD", orchid: "#DA70D6", ivory: "#FFFFF0",
  "bright red": "#FF1A1A", "electric blue": "#0066FF", "neon green": "#39FF14",
};

function colorNameToHex(name: string): string {
  const clean = name.toLowerCase().trim();
  if (COLOR_NAME_HEX[clean]) return COLOR_NAME_HEX[clean];
  // Try to see if it's already a hex code
  if (/^#?[0-9A-Fa-f]{3,8}$/.test(clean)) {
    return clean.startsWith("#") ? clean : `#${clean}`;
  }
  // Fallback: generate a random valid hex color
  const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
  return `#${hex}`;
}

const colorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .regex(/^[a-zA-Z0-9# ]+$/, "Code must match /^[a-zA-Z0-9# ]+$/")
    .optional(),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const sizeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const productDraftSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be greater than 0"),
  discount_price: z.number().positive("Discount price must be greater than 0").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional().default(0),
  category: z.array(z.string().min(1)).min(1, "At least one category is required"),
  subCategory: z.array(z.string().min(1)).optional().default([]),
  subSubCategory: z.array(z.string().min(1)).optional().default([]),
  colors: z.array(z.string().min(1)).min(1, "At least one color is required"),
  material: z.array(z.string().min(1)).optional().default([]),
  sizes: z.array(z.string().min(1)).optional().default([]),
  weight: z.string().min(1, "Weight is required").optional(),
  estimated_delivery_time: z.string().min(1).optional(),
  code: z.string().optional(),
  type: z.string().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  shortDescription: z.string().optional(),
  minimumAge: z.number().int().positive().optional(),
  maximumAge: z.number().int().positive().optional(),
  idealAge: z.number().int().positive().optional(),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isOnSale: z.boolean().optional().default(false),
  isGift: z.boolean().optional().default(false),
  isPersonalized: z.boolean().optional().default(false),
});

const searchProductSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().positive().optional().default(10),
});

const searchFaqSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().positive().optional().default(10),
});

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const createSubCategorySchema = z.object({
  name: z.string().min(1, "Sub-category name is required"),
  category: z.array(z.string().min(1)).min(1, "At least one category ID is required"),
  description: z.string().optional(),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const createSubSubCategorySchema = z.object({
  name: z.string().min(1, "Sub-sub-category name is required"),
  subCategory: z.array(z.string().min(1)).min(1, "At least one sub-category ID is required"),
  description: z.string().optional(),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const updateProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  price: z.number().positive().optional(),
  discount_price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  isGift: z.boolean().optional(),
  isPersonalized: z.boolean().optional(),
});

const createBannerSchema = z.object({
  description: z.string().min(1, "Description is required"),
  order: z.number().int().min(0).max(1000).optional().default(0),
  status: z.boolean().optional().default(false),
});

const createTestimonialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  address: z.string().min(1, "Address is required"),
  image: z.string().optional(),
  status: z.boolean().optional().default(false),
});

const createWhyChooseUsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().optional(),
  status: z.boolean().optional().default(false),
});

const searchWhyChooseUsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().positive().optional().default(10),
});

const createCouponSchema = z.object({
  name: z.string().min(1, "Coupon name is required"),
  code: z.string().min(1, "Coupon code is required"),
  discountPercentage: z.number().min(0, "Discount must be >= 0").max(100, "Discount must be <= 100"),
  minAmount: z.number().min(0, "Min amount must be >= 0"),
  maxAmount: z.number().min(0, "Max amount must be >= 0"),
  description: z.string().optional().default(""),
  expiryDate: z.string().optional(),
  status: z.boolean().optional().default(false),
  type: z.enum(["public", "private"]).optional().default("public"),
});

// ── System prompt (static constant — memoized so it's not regenerated on every loop iteration) ─

const SYSTEM_PROMPT = `You are an AI assistant for the **Kidora Kart** admin panel — an Indian children's toy and educational game e-commerce store. Your job is to help administrators manage the store catalog.

## ⚡ CRITICAL: ACT ON THE LATEST MESSAGE

**THE USER'S LATEST MESSAGE IS THE ONLY ONE YOU SHOULD ACT ON.** 
- Read the last message CAREFULLY. It tells you exactly what to do.
- Do NOT repeat actions you already completed in this conversation.
- Do NOT assume what the user wants — their latest message is the command.
- If the user says a color name like "light blue", "red", "dark green", "purple", etc., you MUST use the \`createColor\` tool, NOT \`createWhyChooseUs\` or any other tool.
- If the user says "create a why choose us" → use \`createWhyChooseUs\`. If the user says "create a light blue color" → use \`createColor\`. These are DIFFERENT tools.

## 🚫 NEVER ASK FOR CONFIRMATION

**NEVER ask the user for additional details or confirmation.** 
- The user expects you to create things IMMEDIATELY.
- If they say "create a why choose us for fast delivery", have the title be "Fast Delivery" and description be a sensible default. DO NOT ask for title/description.
- If they say "create a light blue color", just create it with the name "Light Blue" and the code will be auto-generated.
- Make reasonable assumptions about missing fields. Use sensible defaults.

## STORE OVERVIEW
Kidora Kart is an **India-based online toy store** selling toys, educational games, puzzles, craft kits, and learning materials for children aged 2-14. The store ships across India and uses **rupees (₹)** for pricing.

**Target audience:** Indian parents & children. All content, categories, and product descriptions should be relevant to the Indian market.

**Common Indian toy categories:** Puzzles, Building Blocks, Art & Craft, Educational Games, STEM Kits, Board Games, Soft Toys, Outdoor Toys, Traditional Indian Games (like Ludo, Snakes & Ladders, Carrom), Mythology-themed toys, Musical toys, and more.

**Pricing:** Use Indian Rupees (₹). Typical price range: ₹199 - ₹5,000. Remember that Indian customers expect value-for-money products.

**Cultural context:**
- Festivals like Diwali, Holi, Dussehra are peak shopping seasons
- Popular themes include: animals, Indian mythology, alphabets (English & Hindi), numbers, colors
- Customers look for educational value, safety certifications, and age-appropriateness
- Free shipping and COD (Cash on Delivery) are common expectations

## STATUS RULES
- **ALL created records have INACTIVE status by default.** The admin will review and activate them later.
- Do NOT ask for confirmation before creating — just tell the admin what you're about to do and do it immediately.
- For product drafts, the status is set to "inactive" automatically.

## 🛠️ TOOLS

**SEARCH/LOOKUP (read-only, execute automatically when needed):**
- \`searchProducts\` — Search products by name or description. Shows ID, name, price, stock, status.
- \`searchFaqs\` — Search FAQs by keyword.
- \`lookupMaterials\` — List or search materials by name (wood, plastic, fabric, etc.). Use this BEFORE creating a product to get material IDs.
- \`lookupColors\` — List or search colors by name. Use this BEFORE creating a product to get valid color IDs.
- \`lookupSizes\` — List or search sizes by name (Small, Medium, Large, etc.). Use this BEFORE creating a product to get size IDs.
- \`lookupCategories\` — List or search categories by name. Use this BEFORE creating a product to get category IDs.
- \`lookupSubCategories\` — List or search sub-categories by name. Use this BEFORE creating a product to get sub-category IDs.
- \`lookupSubSubCategories\` — List or search sub-sub-categories by name. Use this BEFORE creating a product to get sub-sub-category IDs.
- \`lookupWhyChooseUs\` — Search existing 'Why Choose Us' entries by title or description.
- \`searchWeb\` — Search the web for information using Wikipedia (free, no API key needed). Use for current events, general knowledge, or facts.
- \`fetchUrl\` — Fetch and read the text content of a webpage. Use to read articles, documentation, or any public URL.
- \`getCurrentTime\` — Get the current date and time. Use when you need to know what time or date it is.

**CREATE (executes immediately, NEVER ask for confirmation, status = inactive):**
- \`createFaq\` — Create a new FAQ. Args: question, answer.
- \`createMaterial\` — Create a new material. Args: name (e.g. "Wood", "Recycled Plastic").
- \`createColor\` — **FOR COLORS.** Args: name (required, e.g. "Light Blue"), code (optional — auto-generated). If the user says "create a [color name]", use THIS tool.
- \`createSize\` — Create a new size. Args: name (e.g. "3-5 years").
- \`createProductDraft\` — Create a new product in INACTIVE status. REQUIRED fields: name, description, price, category (array of category IDs), colors (array of color IDs). Optional: discount_price, stock, tags, sizes, material, weight, etc. Always look up existing categories and colors by name first.
- \`createCategory\` — Create a new product category. Args: name, description (optional).
- \`createSubCategory\` — Create a sub-category under an existing category. Args: name, category (array of parent category IDs).
- \`createSubSubCategory\` — Create a sub-sub-category under an existing sub-category. Args: name, subCategory (array of parent sub-category IDs).
- \`createBanner\` — Create a new promotional banner. Args: description.
- \`createTestimonial\` — Create a customer testimonial. Args: title, description, rating (1-5), address.
- \`createWhyChooseUs\` — **FOR WHY CHOOSE US ENTRIES ONLY.** Args: title, description. NOT for colors, NOT for other items.
- \`createCoupon\` — Create a discount coupon. Args: name, code, discountPercentage (0-100), minAmount, maxAmount.

**UPDATE (executes immediately):**
- \`updateProduct\` — Update product fields: status, price, stock, feature flags.

## 🔄 SIMPLE ITEMS — CREATE IN ONE CALL (NO LOOKUPS NEEDED)

Unlike products, these items can be created DIRECTLY without any lookups first:

---
**FAQ** — just call the tool:
\`createFaq({
  question: "What is the return policy?",
  answer: "We offer a 30-day return policy on all unopened products."
})\`
✅ Created FAQ

**Banner** — just call the tool:
\`createBanner({
  description: "Diwali Sale — Up to 50% off on all toys!"
})\`
✅ Created Banner

**Testimonial** — just call the tool:
\`createTestimonial({
  title: "Great Quality Toys",
  description: "My kids absolutely love the wooden puzzle set. Very sturdy and educational.",
  rating: 5,
  address: "Mumbai, Maharashtra"
})\`
✅ Created Testimonial

**Coupon** — just call the tool (code becomes uppercase):
\`createCoupon({
  name: "Diwali Special",
  code: "DIWALI20",
  discountPercentage: 20,
  minAmount: 500,
  maxAmount: 2000
})\`
✅ Created Coupon

**Why Choose Us** — just call the tool:
\`createWhyChooseUs({
  title: "Free Shipping",
  description: "We offer free shipping on all orders above ₹499 across India."
})\`
✅ Created Why Choose Us entry

**Color** — just call the tool (hex code auto-generated):
\`createColor({ name: "Sky Blue" })\`
✅ Created Color "Sky Blue"

**Material** — just call the tool:
\`createMaterial({ name: "Recycled Plastic" })\`
✅ Created Material

**Size** — just call the tool:
\`createSize({ name: "3-5 years" })\`
✅ Created Size

---

## 🔄 PRODUCT CREATION — COMPLETE WALKTHROUGH (FOLLOW THIS EXACTLY)

**When the user asks to CREATE a product, follow this EXACT chain. Do NOT skip steps. Do NOT stop after lookups.**

Here is a **COMPLETE WORKING EXAMPLE** — memorize this pattern:

---
User says: "create a hulk action figure product"

**Step 1:** Search products to check for duplicates
\`searchProducts(query: "hulk action figure")\` → returns { found: false, results: [] }
(Nothing found — proceed to create)

**Step 2:** Look up the category
\`lookupCategories(query: "Action Figures")\` → returns { count: 1, results: [{ _id: "661a2b3c4d5e6f7a8b9c0d1e", name: "Action Figures" }] }
✅ Found category ID: "661a2b3c4d5e6f7a8b9c0d1e"

**Step 3:** Look up colors
\`lookupColors(query: "Green")\` → returns { count: 1, results: [{ _id: "772a2b3c4d5e6f7a8b9c0d2f", name: "Green" }] }
✅ Found color ID: "772a2b3c4d5e6f7a8b9c0d2f"

**Step 4:** Look up materials
\`lookupMaterials(query: "Plastic")\` → returns { count: 1, results: [{ _id: "883a2b3c4d5e6f7a8b9c0d3g", name: "Plastic" }] }
✅ Found material ID: "883a2b3c4d5e6f7a8b9c0d3g"

**Step 5:** NOW create the product with the REAL IDs from steps 2-4
\`createProductDraft({
  name: "Hulk Action Figure",
  description: "A detailed 12-inch Hulk action figure with movable joints, perfect for children aged 3+. Made from durable, non-toxic plastic.",
  price: 999,
  discount_price: 799,
  stock: 50,
  category: ["661a2b3c4d5e6f7a8b9c0d1e"],
  colors: ["772a2b3c4d5e6f7a8b9c0d2f"],
  material: ["883a2b3c4d5e6f7a8b9c0d3g"],
  tags: ["action-figure", "hulk", "superhero", "marvel"],
  minimumAge: 3,
  maximumAge: 10,
  isFeatured: true
})\`
✅ Created Hulk Action Figure (inactive)

---

**ALTERNATIVE: When a category/color doesn't exist yet**
User says: "create a wooden puzzle for kids"

**Step 1:** \`lookupCategories(query: "Puzzles")\` → returns { count: 0, results: [] }
(Category doesn't exist — create it first!)

**Step 2:** \`createCategory({ name: "Puzzles", description: "Jigsaw puzzles, wooden puzzles, and brain teasers for kids" })\`
✅ Created category "Puzzles" → ID: "994a2b3c4d5e6f7a8b9c0d4h"

**Step 3:** \`lookupColors(query: "Wood")\` → returns { count: 0, results: [] }
(Color doesn't exist — create it!)

**Step 4:** \`createColor({ name: "Natural Wood" })\`
✅ Created color "Natural Wood" → ID: "aa5a2b3c4d5e6f7a8b9c0d5i"

**Step 5:** \`lookupMaterials(query: "Wood")\` → might return Wood → ID: "bb6a2b3c4d5e6f7a8b9c0d6j"

**Step 6:** \`createProductDraft({
  name: "Wooden Puzzle",
  price: 599,
  category: ["994a2b3c4d5e6f7a8b9c0d4h"],
  colors: ["aa5a2b3c4d5e6f7a8b9c0d5i"],
  material: ["bb6a2b3c4d5e6f7a8b9c0d6j"],
  ...
})\`
✅ Created Wooden Puzzle (inactive)

---

**⚠️ CRITICAL: NEVER do this:**
- ❌ DO NOT call a lookup tool, wait for results, then ONLY output text like "I found the category" — KEEP GOING and call the next tool
- ❌ DO NOT call the SAME lookup tool twice — if you already looked up categories, don't do it again
- ❌ DO NOT make up fake IDs like "cat123" — use the actual _id values returned by lookup tools
- ❌ DO NOT stop and ask "should I create the product now?" — just create it
- ❌ DO NOT ask the user "what price?" — use reasonable defaults (₹299-₹999 for toys)

**✅ ALWAYS do this:** Call a lookup → get the ID → IMMEDIATELY use that ID in the next call → keep going until the product is created. One smooth chain, no pauses.

## IMPORTANT RULES
- **ALWAYS** search/look up existing data BEFORE creating new records to avoid duplicates — BUT then CREATE immediately after if nothing found.
- The search is a CHECK, not a final action. After searching, you MUST create if no duplicates exist.
- For product drafts: first look up categories and colors by name to get their ObjectIds. Create any that don't exist.
- For colors: the \`code\` (hex) field is OPTIONAL. If the admin says "light blue" just pass the name and the code will be auto-generated. Do NOT ask for a hex code.
- For testimonials: rating must be 1-5. Use a placeholder image if none provided.
- For coupons: codes are auto-converted to uppercase.
- NEVER make up IDs — always use \`search\` or \`lookup\` tools to find real IDs.
- Be concise, friendly, and confirm what was created.
- When the user says \`create a [color name]\` → call \`createColor\`. When they say \`create a why choose us\` → call \`createWhyChooseUs\`. These are completely different!

## 🧠 YOU MUST MAKE ALL TOOL CALLS IN A SINGLE RESPONSE

**CRITICAL RULE: Once you start working on a task, NEVER STOP until all actions are done.** 

**Do NOT ever do this (BAD — stops after one step):**
- ❌ Call \`lookupCategories\`, get the result, then output "I found the category. Should I create the product now?"
- ❌ Call \`lookupColors\`, then output "I found green. What other colors should I use?"
- ❌ Call one tool, then wait for the user to say "continue"

**Instead, ALWAYS do this (GOOD — chain everything):**
1. ✅ Call \`lookupCategories\` → get IDs
2. ✅ **IMMEDIATELY** call \`lookupColors\` → get IDs
3. ✅ **IMMEDIATELY** call \`lookupMaterials\` → get IDs
4. ✅ **IMMEDIATELY** call \`lookupSizes\` → get IDs if needed
5. ✅ **IMMEDIATELY** call \`createProductDraft\` with all IDs

All of these happen in ONE response. You call a tool, the SDK gives you the result, and you IMMEDIATELY call the next tool. No pauses. No questions. Keep going until the product is created.

**MANDATORY: Product creation chain (DO ALL STEPS, do not stop after step 1):**
1. \`lookupCategories\` → find categories by name to get their IDs
2. \`lookupColors\` → find colors by name to get their IDs
3. \`lookupMaterials\` → find materials (optional but recommended)
4. \`lookupSizes\` → find sizes if the product needs sizes
5. \`lookupSubCategories\` → if the product needs a sub-category
6. \`lookupSubSubCategories\` → if needed
7. If any category/color/material doesn't exist, \`createCategory\` / \`createColor\` / \`createMaterial\` FIRST
8. **FINALLY**: \`createProductDraft\` with ALL IDs from steps 1-7

**If you stop after lookups and don't create, the system will auto-continue and force you to finish.** So do it right the first time: one shot, all steps, no pauses.`;

// ── Helper: generate a slug ────────────────────────────────────────

// ── Helper: check for MongoDB duplicate-key errors and return a user-friendly message ─

function isDuplicateError(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function generateSlug(text: string): Promise<string> {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const count = await ProductModel.countDocuments({
    slug: new RegExp(`^${escapeRegex(base)}`),
  });
  return count === 0 ? base : `${base}-${count}`;
}

// ── Tool definitions ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentTools: Record<string, any> = {
  // ── Search / Lookup tools (read-only) ───────────────────────────

  searchProducts: {
    description: "Search products by name or description. Returns matching products with key details.",
    parameters: searchProductSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const products = await ProductModel.find({
        deletedAt: null,
        $or: [
          { name: { $regex: escapeRegex(args.query), $options: "i" } },
          { description: { $regex: escapeRegex(args.query), $options: "i" } },
          { tags: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("name slug price discount_price stock status category")
        .populate("category", "name")
        .limit(args.limit ?? 10)
        .lean();
      return { found: products.length > 0, results: products };
    },
  },

  searchFaqs: {
    description: "Search FAQs by keyword in question or answer.",
    parameters: searchFaqSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const faqs = await FaqModel.find({
        deletedAt: null,
        $or: [
          { question: { $regex: escapeRegex(args.query), $options: "i" } },
          { answer: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("question answer status order")
        .limit(args.limit ?? 10)
        .lean();
      return { found: faqs.length > 0, results: faqs };
    },
  },

  lookupMaterials: {
    description: "List or search materials by name. Returns material IDs.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const materials = await MaterialModel.find(filter)
        .select("_id name order")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: materials.length, results: materials };
    },
  },

  lookupColors: {
    description: "List or search colors by name. Returns color IDs.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const colors = await ColorModel.find(filter)
        .select("_id name code order")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: colors.length, results: colors };
    },
  },

  lookupSizes: {
    description: "List or search sizes by name. Returns size IDs.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const sizes = await SizeModel.find(filter)
        .select("_id name order")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: sizes.length, results: sizes };
    },
  },

  lookupCategories: {
    description: "List or search categories by name. Returns category IDs needed to create products.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const categories = await CategoryModel.find(filter)
        .select("_id name slug order")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: categories.length, results: categories };
    },
  },

  lookupSubCategories: {
    description: "List or search sub-categories by name. Returns sub-category IDs with their parent category reference.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const subCategories = await SubCategoryModel.find(filter)
        .select("_id name slug category order")
        .populate("category", "name")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: subCategories.length, results: subCategories };
    },
  },

  lookupSubSubCategories: {
    description: "List or search sub-sub-categories by name. Returns sub-sub-category IDs with their parent sub-category reference.",
    parameters: z.object({
      query: z.string().optional().default(""),
    }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) {
        filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      }
      const subSubCategories = await SubSubCategoryModel.find(filter)
        .select("_id name slug subCategory order")
        .populate("subCategory", "name")
        .sort({ order: 1 })
        .limit(20)
        .lean();
      return { count: subSubCategories.length, results: subSubCategories };
    },
  },

  lookupWhyChooseUs: {
    description: "Search existing 'Why Choose Us' entries by title or description.",
    parameters: searchWhyChooseUsSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const entries = await WhyChooseUsModel.find({
        deletedAt: null,
        $or: [
          { title: { $regex: escapeRegex(args.query), $options: "i" } },
          { description: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("title description status")
        .limit(args.limit ?? 10)
        .lean();
      return { count: entries.length, results: entries };
    },
  },

  // ── Create tools (execute directly, status defaults to inactive) ─

  createFaq: {
    description: "Create a new FAQ entry. Status defaults to inactive.",
    parameters: faqSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = faqSchema.parse(args);
      const doc = new FaqModel(parsed);
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `FAQ "${parsed.question}" already exists` };
        }
        throw saveErr;
      }
      cache.del("faqData");
      return { created: true, toolName: "createFaq", id: result._id, name: parsed.question };
    },
  },

  createMaterial: {
    description: "Create a new material option. Status defaults to inactive.",
    parameters: materialSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = materialSchema.parse(args);
      const doc = new MaterialModel(parsed);
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Material "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      cache.del("materialData");
      return { created: true, toolName: "createMaterial", id: result._id, name: parsed.name };
    },
  },

  createColor: {
    description: "Create a new color option. Auto-generates hex code from color name if not provided. Status defaults to inactive.",
    parameters: colorSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = colorSchema.parse(args);
      const doc = new ColorModel({
        name: parsed.name,
        code: parsed.code || colorNameToHex(parsed.name),
        order: parsed.order,
        status: parsed.status,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Color "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      cache.del("colorData");
      return { created: true, toolName: "createColor", id: result._id, name: parsed.name, code: doc.code };
    },
  },

  createSize: {
    description: "Create a new size option. Status defaults to inactive.",
    parameters: sizeSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = sizeSchema.parse(args);
      const doc = new SizeModel(parsed);
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Size "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      cache.del("sizeData");
      return { created: true, toolName: "createSize", id: result._id, name: parsed.name };
    },
  },

  createProductDraft: {
    description: "Create a new product in INACTIVE status. Requires name, description, price, category IDs, and color IDs. Status is set to inactive for admin review.",
    parameters: productDraftSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = productDraftSchema.parse(args);

      // Validate discount_price vs price
      if (parsed.discount_price !== undefined && parsed.discount_price > parsed.price) {
        return { error: "Discount price must be less than or equal to the original price" };
      }

      // Validate ages
      if (parsed.minimumAge !== undefined && parsed.maximumAge !== undefined && parsed.minimumAge >= parsed.maximumAge) {
        return { error: "Minimum age must be less than maximum age" };
      }

      if (
        parsed.idealAge !== undefined &&
        parsed.minimumAge !== undefined &&
        parsed.maximumAge !== undefined &&
        (parsed.idealAge < parsed.minimumAge || parsed.idealAge > parsed.maximumAge)
      ) {
        return { error: "Ideal age must be between minimum age and maximum age" };
      }

      // Verify referenced IDs exist
      for (const catId of parsed.category) {
        const exists = await CategoryModel.findById(catId).select("_id").lean();
        if (!exists) {
          return { error: `Category with ID "${catId}" not found` };
        }
      }
      for (const subCatId of parsed.subCategory) {
        const exists = await SubCategoryModel.findById(subCatId).select("_id").lean();
        if (!exists) {
          return { error: `SubCategory with ID "${subCatId}" not found` };
        }
      }
      for (const colorId of parsed.colors) {
        const exists = await ColorModel.findById(colorId).select("_id").lean();
        if (!exists) {
          return { error: `Color with ID "${colorId}" not found` };
        }
      }
      for (const sscId of parsed.subSubCategory) {
        const exists = await SubSubCategoryModel.findById(sscId).select("_id").lean();
        if (!exists) {
          return { error: `SubSubCategory with ID "${sscId}" not found` };
        }
      }
      for (const matId of parsed.material) {
        const exists = await MaterialModel.findById(matId).select("_id").lean();
        if (!exists) {
          return { error: `Material with ID "${matId}" not found` };
        }
      }
      for (const sizeId of parsed.sizes) {
        const exists = await SizeModel.findById(sizeId).select("_id").lean();
        if (!exists) {
          return { error: `Size with ID "${sizeId}" not found` };
        }
      }

      // Build product document
      const productData: Record<string, unknown> = {
        ...parsed,
        status: "inactive",  // Always inactive for admin review
        code: parsed.code || `DRAFT-${Date.now()}`,
        weight: parsed.weight || "0",
        estimated_delivery_time: parsed.estimated_delivery_time || "3-5 business days",
        slug: await generateSlug(parsed.name),
        image: "https://placehold.co/400x400?text=Draft+Product",
        images: [],
      };

      const doc = new ProductModel(productData);
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Product "${parsed.name}" already exists (duplicate slug or name)` };
        }
        throw saveErr;
      }
      cache.del("newArrivals");
      cache.del("trendingProducts");
      cache.del("bestSellers");
      return { created: true, toolName: "createProductDraft", id: result._id, name: parsed.name, status: "inactive" };
    },
  },

  // ── New direct-create tools ─────────────────────────────────────

  createCategory: {
    description: "Create a new product category. Status defaults to inactive.",
    parameters: createCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createCategorySchema.parse(args);
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new CategoryModel({
        name: parsed.name,
        slug,
        description: parsed.description || "",
        order: parsed.order,
        status: parsed.status,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Category "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      return { created: true, toolName: "createCategory", id: result._id, name: parsed.name, status: "inactive" };
    },
  },

  createSubCategory: {
    description: "Create a new sub-category under a parent category. Requires name and category ID(s). Status defaults to inactive.",
    parameters: createSubCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createSubCategorySchema.parse(args);
      // Verify parent category IDs exist
      for (const catId of parsed.category) {
        const exists = await CategoryModel.findById(catId).select("_id").lean();
        if (!exists) {
          return { error: `Category with ID "${catId}" not found` };
        }
      }
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new SubCategoryModel({
        name: parsed.name,
        slug,
        category: parsed.category,
        description: parsed.description || "",
        order: parsed.order,
        status: parsed.status,
        image: "https://placehold.co/400x400?text=SubCategory",
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `SubCategory "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      return { created: true, toolName: "createSubCategory", id: result._id, name: parsed.name };
    },
  },

  createSubSubCategory: {
    description: "Create a new sub-sub-category under a parent sub-category. Requires name and subCategory ID(s). Status defaults to inactive.",
    parameters: createSubSubCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createSubSubCategorySchema.parse(args);
      // Verify parent sub-category IDs exist
      for (const subCatId of parsed.subCategory) {
        const exists = await SubCategoryModel.findById(subCatId).select("_id").lean();
        if (!exists) {
          return { error: `SubCategory with ID "${subCatId}" not found` };
        }
      }
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new SubSubCategoryModel({
        name: parsed.name,
        slug,
        subCategory: parsed.subCategory,
        description: parsed.description || "",
        order: parsed.order,
        status: parsed.status,
        image: "https://placehold.co/400x400?text=SubSubCategory",
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `SubSubCategory "${parsed.name}" already exists` };
        }
        throw saveErr;
      }
      return { created: true, toolName: "createSubSubCategory", id: result._id, name: parsed.name };
    },
  },

  updateProduct: {
    description: "Update an existing product's fields (status, price, stock, flags). Executes immediately.",
    parameters: updateProductSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = updateProductSchema.parse(args);
      const existing = await ProductModel.findById(parsed.productId);
      if (!existing) {
        return { error: `Product with ID "${parsed.productId}" not found` };
      }
      const updateFields: Record<string, unknown> = {};
      if (parsed.status !== undefined) updateFields.status = parsed.status;
      if (parsed.price !== undefined) updateFields.price = parsed.price;
      if (parsed.discount_price !== undefined) updateFields.discount_price = parsed.discount_price;
      if (parsed.stock !== undefined) updateFields.stock = parsed.stock;
      if (parsed.isFeatured !== undefined) updateFields.isFeatured = parsed.isFeatured;
      if (parsed.isNewArrival !== undefined) updateFields.isNewArrival = parsed.isNewArrival;
      if (parsed.isBestSeller !== undefined) updateFields.isBestSeller = parsed.isBestSeller;
      if (parsed.isOnSale !== undefined) updateFields.isOnSale = parsed.isOnSale;
      if (parsed.isGift !== undefined) updateFields.isGift = parsed.isGift;
      if (parsed.isPersonalized !== undefined) updateFields.isPersonalized = parsed.isPersonalized;

      const updated = await ProductModel.findByIdAndUpdate(
        parsed.productId,
        { $set: updateFields },
        { new: true, runValidators: true },
      );
      if (!updated) {
        return { error: "Failed to update product" };
      }
      cache.del("newArrivals");
      cache.del("trendingProducts");
      cache.del("bestSellers");
      return { updated: true, toolName: "updateProduct", id: updated._id, name: updated.name, changes: updateFields };
    },
  },

  createBanner: {
    description: "Create a new banner. Status defaults to inactive.",
    parameters: createBannerSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createBannerSchema.parse(args);
      const doc = new BannerModel({
        image: "https://placehold.co/1200x400?text=Banner",
        description: parsed.description,
        order: parsed.order,
        status: parsed.status,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: "Banner with this description already exists" };
        }
        throw saveErr;
      }
      cache.del("bannerData");
      return { created: true, toolName: "createBanner", id: result._id, description: parsed.description.slice(0, 60) };
    },
  },

  createTestimonial: {
    description: "Create a new testimonial. Status defaults to inactive.",
    parameters: createTestimonialSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createTestimonialSchema.parse(args);
      const doc = new TestimonialModel({
        title: parsed.title,
        description: parsed.description,
        rating: parsed.rating,
        address: parsed.address,
        image: parsed.image || "https://placehold.co/100x100?text=Testimonial",
        status: parsed.status,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: "Testimonial with this title already exists" };
        }
        throw saveErr;
      }
      cache.del("testimonialData");
      return { created: true, toolName: "createTestimonial", id: result._id, title: parsed.title };
    },
  },

  createWhyChooseUs: {
    description: "Create a new 'Why Choose Us' entry. Describes why customers should shop at Kidora Kart. Status defaults to inactive.",
    parameters: createWhyChooseUsSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createWhyChooseUsSchema.parse(args);
      const doc = new WhyChooseUsModel({
        title: parsed.title,
        description: parsed.description,
        image: parsed.image || "https://placehold.co/100x100?text=WhyChooseUs",
        status: parsed.status,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Why Choose Us "${parsed.title}" already exists` };
        }
        throw saveErr;
      }
      cache.del("whyChooseUsData");
      return { created: true, toolName: "createWhyChooseUs", id: result._id, title: parsed.title };
    },
  },

  createCoupon: {
    description: "Create a new discount coupon. Status defaults to inactive.",
    parameters: createCouponSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createCouponSchema.parse(args);
      const doc = new CoupenModel({
        name: parsed.name,
        code: parsed.code.toUpperCase(),
        discountPercentage: parsed.discountPercentage,
        minAmount: parsed.minAmount,
        maxAmount: parsed.maxAmount,
        description: parsed.description || "",
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
        status: parsed.status,
        type: parsed.type,
      });
      let result;
      try {
        result = await doc.save();
      } catch (saveErr) {
        if (isDuplicateError(saveErr)) {
          return { error: `Coupon code "${parsed.code.toUpperCase()}" already exists` };
        }
        throw saveErr;
      }
      cache.del("coupenData");
      return { created: true, toolName: "createCoupon", id: result._id, name: parsed.name, code: parsed.code.toUpperCase() };
    },
  },

  // ── General utility tools ──────────────────────────────────────

  searchWeb: {
    description: "Search the web for information using Wikipedia. Works without any API keys. Returns summaries of relevant pages.",
    parameters: z.object({
      query: z.string().min(1, "Search query is required"),
    }),
    execute: async (args: { query: string }) => {
      try {
        // Search Wikipedia
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/search/page?q=${encodeURIComponent(args.query)}&limit=5`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) {
          return { error: `Search failed with status ${searchResp.status}` };
        }
        const searchData = (await searchResp.json()) as {
          pages?: Array<{
            id: number;
            title: string;
            description?: string;
            extract?: string;
            thumbnail?: { source: string };
          }>;
        };

        if (!searchData.pages || searchData.pages.length === 0) {
          return { results: [], note: "No Wikipedia results found. Try a different query." };
        }

        // Fetch summaries in parallel for better performance
        const settledResults = await Promise.allSettled(
          searchData.pages.slice(0, 5).map(async (page) => {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summaryResp = await fetch(summaryUrl);
            if (summaryResp.ok) {
              const summary = (await summaryResp.json()) as {
                extract?: string;
                content_urls?: { desktop?: { page?: string } };
              };
              return {
                title: page.title,
                description: page.description || "",
                snippet: (summary.extract || page.extract || "").slice(0, 1000),
                url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
              };
            }
            // fallback to basic info if summary fetch fails
            return {
              title: page.title,
              description: page.description || "",
              snippet: (page.extract || "").slice(0, 500),
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            };
          }),
        );

        const results = settledResults
          .filter((r): r is PromiseFulfilledResult<{ title: string; description: string; snippet: string; url: string }> => r.status === "fulfilled")
          .map((r) => r.value);

        return { results, source: "Wikipedia" };
      } catch (err) {
        logger.error({ err }, "Web search failed");
        return { error: err instanceof Error ? err.message : "Search request failed" };
      }
    },
  },

  fetchUrl: {
    description: "Fetch and read content from a URL (public http/https only). Use this to read webpages, articles, or documentation. Returns plain text with links.",
    parameters: z.object({
      url: z.string().url("A valid URL is required").min(1),
      maxChars: z.number().int().positive().optional().default(5000),
    }),
    execute: async (args: { url: string; maxChars?: number }) => {
      try {
        // SSRF protection: only allow public http/https URLs, block private IPs
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(args.url);
        } catch {
          return { error: "Invalid URL format" };
        }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return { error: "Only http and https URLs are allowed" };
        }
        const hostname = parsedUrl.hostname.toLowerCase();
        const blockedPatterns = [
          /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])/, /^192\.168\./,
          /^0\./, /^169\.254\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])/,
          /^::1$/, /^localhost$/i, /\.local$/i, /\.internal$/i,
          /^fc00:/i, /^fd00:/i, /^fe80:/i,
        ];
        if (blockedPatterns.some((p) => p.test(hostname))) {
          return { error: "URL points to a private or internal network, which is not allowed" };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const resp = await fetch(args.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "KidoraKart-Admin/1.0 (AI agent; internal use)",
            Accept: "text/html,text/plain,*/*",
          },
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          return { error: `Failed to fetch URL: ${resp.status} ${resp.statusText}` };
        }

        const text = await resp.text();
        const maxLen = args.maxChars ?? 5000;

        // Strip HTML tags to get plain text
        const plainText = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .replace(/&[a-z]+;/g, " ")
          .trim()
          .slice(0, maxLen);

        return {
          url: args.url,
          content: plainText,
          truncated: text.length > maxLen,
          characters: plainText.length,
        };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return { error: "Request timed out after 10 seconds" };
        }
        logger.error({ err }, "fetchUrl failed");
        return { error: err instanceof Error ? err.message : "Failed to fetch URL" };
      }
    },
  },

  getCurrentTime: {
    description: "Get the current date and time. Useful when you need to know what time it is, the current date, or day of the week.",
    parameters: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        }),
        time: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }),
        iso: now.toISOString(),
        timestamp: now.getTime(),
      };
    },
  },
};

// ── Controllers ────────────────────────────────────────────────────

/**
 * GET /api/admin/ai-agent/providers
 * Returns the list of configured providers for the frontend dropdown.
 */
export const listProviders = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const configured = listConfiguredProviders();
  return res.status(200).json({
    _status: true,
    _data: configured,
  });
};

/**
 * GET /api/admin/ai-agent/history
 * Returns recent AI agent conversations for the history sidebar.
 */
export const listHistory = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { page: rawPage, limit: rawLimit } = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(rawPage ?? 1));
    const limit = Math.min(50, Math.max(1, Number(rawLimit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AiResponse.find({ page: "ai-agent", adminId: req.user?._id })
        .select("prompt response messages createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AiResponse.countDocuments({ page: "ai-agent", adminId: req.user?._id }),
    ]);

    return res.status(200).json({
      _status: true,
      _data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing AI agent history");
    return res.status(500).json({
      _status: false,
      _message: "Failed to fetch history",
    });
  }
};

/**
 * POST /api/admin/ai-agent/chat
 * Accepts: { messages: Array<{ role, content }>, provider?: AiProviderName, conversationId?: string }
 * Streams the agent response. Groups messages by conversationId.
 */
export const chat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { messages, provider, conversationId } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      provider?: AiProviderName;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        _status: false,
        _message: "Messages array is required",
      });
      return;
    }

    // Validate message roles — only allow "user" or "assistant"
    for (const [i, m] of messages.entries()) {
      if (!m.role || (m.role !== "user" && m.role !== "assistant")) {
        res.status(400).json({
          _status: false,
          _message: `Invalid message role at index ${i}: expected "user" or "assistant"`,
        });
        return;
      }
      if (typeof m.content !== "string" || m.content.length > 10000) {
        res.status(400).json({
          _status: false,
          _message: `Invalid content at index ${i}: must be a string with max 10000 characters`,
        });
        return;
      }
    }

    // Check configured
    const configured = listConfiguredProviders();
    if (configured.length === 0) {
      res.status(503).json({
        _status: false,
        _message: "AI is not configured on the server",
      });
      return;
    }

    // Resolve the model
    let model;
    try {
      model = resolveModel(provider);
    } catch (err) {
      res.status(400).json({
        _status: false,
        _message:
          err instanceof Error
            ? err.message
            : "Selected AI provider is not available",
      });
      return;
    }

    // Build initial SDK messages from the frontend
    const sdKMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Set NDJSON headers for streaming
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let conversationIdToUse = conversationId || "";
    const cumulativeToolSummaries: string[] = [];
    const allAssistantContents: string[] = [];
    const allAccumulatedToolResults: string[] = []; // All tool results across all iterations, for use in continuation

    // If conversationId provided, verify it exists (with CastError handling)
    if (conversationId) {
      try {
        const exists = await AiResponse.findById(conversationId).select("_id").lean();
        if (!exists) {
          logger.warn({ conversationId }, "Invalid conversationId, will create new");
          conversationIdToUse = "";
        }
      } catch (convErr) {
        // CastError = malformed ObjectId — treat as new conversation
        logger.warn({ conversationId, err: convErr }, "Invalid conversationId format, will create new");
        conversationIdToUse = "";
      }
    }

    // ── Auto-continuation loop ──────────────────────────────────────
    // Some AI models stop after one tool call instead of chaining.
    // We loop: track what happened, and if the task isn't complete,
    // push a continuation message and re-call streamText.

    const MAX_ITERATIONS = 8;
    let iteration = 0;
    let currentSdkMessages = [...sdKMessages];
    const calledToolNames = new Set<string>();
    let lookupOnlyIterationCount = 0;
    let hasEverCreatedOrUpdated = false;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      logger.info({ iteration, totalToolSummaries: cumulativeToolSummaries.length }, "AI agent loop iteration");

      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: currentSdkMessages,
        tools: agentTools,
        temperature: 0.2,
        maxOutputTokens: 4096,
      });

      let iterationAssistantContent = "";
      let iterationHasToolCall = false;
      let iterationHasCreateOrUpdateAction = false;
      const iterationToolNames: string[] = [];
      const iterationToolSummaries: string[] = [];

      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
          iterationAssistantContent += chunk.text;
          res.write(
            JSON.stringify({ type: "text", text: chunk.text }) + "\n",
          );
        } else if (chunk.type === "tool-call") {
          iterationHasToolCall = true;
          iterationToolNames.push(chunk.toolName);
          if (chunk.toolName.startsWith("create") || chunk.toolName.startsWith("update")) {
            iterationHasCreateOrUpdateAction = true;
          }
          res.write(
            JSON.stringify({
              type: "tool-call",
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              args: chunk.input,
            }) + "\n",
          );
        } else if (chunk.type === "tool-result") {
          res.write(
            JSON.stringify({
              type: "tool-result",
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              result: chunk.output,
            }) + "\n",
          );

          const output = chunk.output as Record<string, unknown> | undefined;
          if (output?.created === true) {
            const label = (output.name as string) || chunk.toolName.replace(/^create/, "");
            iterationToolSummaries.push(`✅ Created ${label}`);
          } else if (output?.updated === true) {
            const label = (output.name as string) || "";
            iterationToolSummaries.push(`✅ Updated ${label}`);
          }

          // Track tool results for feeding back into auto-continuation (accumulated across all iterations)
          const resultSummary = chunk.toolName + ": " + JSON.stringify(chunk.output).slice(0, 300);
          if (!allAccumulatedToolResults.some((r) => r === resultSummary)) {
            allAccumulatedToolResults.push(resultSummary);
          }
        } else if (chunk.type === "error") {
          logger.error({ err: chunk.error }, "AI agent streaming error");
          const errorMessage =
            chunk.error instanceof Error
              ? chunk.error.message
              : String(chunk.error);
          res.write(
            JSON.stringify({ type: "error", message: errorMessage }) + "\n",
          );
        }
        // Note: we DON'T handle "finish" here — we handle it AFTER the loop
      }

      // ── Track iteration results ────────────────────────────────────
      allAssistantContents.push(iterationAssistantContent);
      cumulativeToolSummaries.push(...iterationToolSummaries);

      // ── Stuck detection: AI repeating lookups without creating ─────
      const newToolNames = iterationToolNames.filter((name) => !calledToolNames.has(name));
      iterationToolNames.forEach((name) => calledToolNames.add(name));

      hasEverCreatedOrUpdated = hasEverCreatedOrUpdated || iterationHasCreateOrUpdateAction;
      const hasCreateOrUpdate = iterationHasCreateOrUpdateAction;
      // Detect if iteration only had lookups/searches (no create/update tools)
      const allWereLookups = iterationToolNames.length > 0 &&
        !iterationToolNames.some((name) => name.startsWith("create") || name.startsWith("update"));

      if (allWereLookups && newToolNames.length === 0 && iteration > 1) {
        lookupOnlyIterationCount++;
      } else if (hasCreateOrUpdate) {
        lookupOnlyIterationCount = 0; // Reset — made progress
      }

      // ── Decide whether to continue ─────────────────────────────────
      // Task is complete ONLY if a create/update tool was called this iteration,
      // OR if no tool was called AND a create/update has happened in a previous iteration.
      // If no create has ever happened, outputting text without a tool call is STUCK, not done.
      const taskComplete = iterationHasCreateOrUpdateAction || (!iterationHasToolCall && hasEverCreatedOrUpdated);

      if (taskComplete) {
        break;
      }

      // ── Stuck: break after 2 repeated lookup-only iterations ───────
      if (lookupOnlyIterationCount >= 2) {
        logger.warn({ iteration, lookupOnlyIterationCount }, "AI agent stuck in lookup loop, breaking");
        res.write(
          JSON.stringify({
            type: "text",
            text: "\n\n⚠️ The AI was unable to create the product — it kept repeating lookups instead of creating. You may need to create the necessary categories, colors, and materials first, then try again.",
          }) + "\n",
        );
        break;
      }

      // ── Auto-continue: task incomplete, send continuation ───────────
      if (iteration < MAX_ITERATIONS) {
        res.write(
          JSON.stringify({ type: "continuation" }) + "\n",
        );

        // Find the last user message for context
        const lastUserMsg = [...currentSdkMessages].reverse().find((m) => m.role === "user");
        const userContext = lastUserMsg?.content?.slice(0, 100) || sdKMessages[0]?.content?.slice(0, 100) || "complete the task";

        // Build a continuation message with ALL accumulated tool results (not just this iteration)
        // and a ready-to-copy createProductDraft template
        const allResults = allAccumulatedToolResults.length > 0
          ? `\n\nAll tool results so far:\n${allAccumulatedToolResults.join("\n")}`
          : "";
         const continuationText = `[AUTO-CONTINUE] The user asked: "${userContext}".${allResults}\\n\\nNow you MUST call createProductDraft with the IDs from the results above. Here is the EXACT template to fill in — just copy the IDs from above into it and call the tool:\\n\\ncreateProductDraft({\\n  name: \\"[product name from user request]\\",\\n  description: \\"[suitable description]\\",\\n  price: [reasonable price in INR],\\n  discount_price: [optional discount price (lower than price)],\\n  stock: [number of units available],\\n  category: [\\"[category ID from lookup above]\\"],\\n  colors: [\\"[color ID from lookup above]\\"],\\n  material: [\\"[material ID from lookup above]\\"] // if found\\n})\\n\\nIMPORTANT: If you still need colors, materials, or sizes, call those lookup tools FIRST. Then call createProductDraft. Do NOT output text without calling a tool. Call a lookup or createProductDraft NOW.`;

        // Add this iteration's output and the continuation prompt as a new user message
        currentSdkMessages = [
          ...currentSdkMessages,
          { role: "assistant" as const, content: iterationAssistantContent },
          { role: "user" as const, content: continuationText },
        ];
      }
    }

    // ── All iterations complete — send final finish ───────────────
    logger.info(
      { iterations: iteration, toolSummaries: cumulativeToolSummaries.length },
      "AI agent response complete",
    );

    // Build enriched response from all assistant content + tool summaries
    const totalContent = allAssistantContents.join("\n").trim();
    let savedResponse = totalContent;
    if (cumulativeToolSummaries.length > 0) {
      if (!savedResponse || savedResponse.length < 20) {
        savedResponse = cumulativeToolSummaries.join("\n");
      } else {
        savedResponse += "\n\n" + cumulativeToolSummaries.join("\n");
      }
    }
    if (!savedResponse) savedResponse = "Conversation saved";

    // Save/update conversation record
    try {
      if (conversationIdToUse) {
        const existingFirstUserMsg = messages.find((m) => m.role === "user");
        // Atomic ownership check + update (prevents TOCTOU race)
        await AiResponse.findOneAndUpdate(
          {
            _id: conversationIdToUse,
            adminId: req.user?._id,
            page: "ai-agent",
          },
          {
            $set: {
              prompt: existingFirstUserMsg?.content?.slice(0, 200) || messages[0]?.content?.slice(0, 200) || "ai-agent chat",
              response: savedResponse.slice(0, 500),
              messages,
            },
          },
        );
      } else {
        const firstUserMsg = messages.find((m) => m.role === "user");
        const newRecord = await AiResponse.create({
          prompt: firstUserMsg?.content?.slice(0, 200) || messages[0]?.content?.slice(0, 200) || "ai-agent chat",
          response: savedResponse.slice(0, 500),
          messages,
          page: "ai-agent",
          adminId: req.user?._id,
        });
        conversationIdToUse = String(newRecord._id);
      }
    } catch (saveErr) {
      logger.error({ err: saveErr }, "Failed to save AI agent conversation");
    }

    res.write(
      JSON.stringify({
        type: "finish",
        conversationId: conversationIdToUse || undefined,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      }) + "\n",
    );

    res.end();
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to process AI agent request";
    logger.error({ err }, "AI agent chat error");

    if (!res.headersSent) {
      res.status(500).json({
        _status: false,
        _message: message,
      });
    } else {
      res.write(
        JSON.stringify({ type: "error", message }) + "\n",
      );
      res.end();
    }
  }
};

/**
 * DELETE /api/admin/ai-agent/history/:id
 * Permanently deletes an AI agent conversation belonging to the current admin.
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const result = await AiResponse.findOneAndDelete({
      _id: id,
      adminId: req.user?._id,
      page: "ai-agent",
    });

    if (!result) {
      return res.status(404).json({
        _status: false,
        _message: "Conversation not found",
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "Conversation permanently deleted",
    });
  } catch (err) {
    logger.error({ err }, "Error deleting AI agent conversation");
    return res.status(500).json({
      _status: false,
      _message: "Failed to delete conversation",
    });
  }
};
