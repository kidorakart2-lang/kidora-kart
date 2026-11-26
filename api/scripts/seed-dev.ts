/**
 * Development seed — local-only catalogue data.
 *
 * Images live in `web/public/images/products` (copied from the `ui/Khushbu
 * Jewellers…` folder), NOT Cloudflare. Run from `api/`:
 *
 *   npx tsx scripts/seed-dev.ts
 *
 * Idempotent: records are matched by slug/name/code and only inserted when
 * missing. Nothing is deleted.
 */
import "dotenv/config";
import mongoose from "mongoose";

import Product from "../src/models/product.js";
import Category from "../src/models/category.js";
import SubCategory from "../src/models/subCategory.js";
import ColorModel from "../src/models/color.js";
import MaterialModel from "../src/models/material.js";
import BannerModel from "../src/models/banner.js";
import Testimonial from "../src/models/testimonial.js";
import WhyChooseUs from "../src/models/whyChooseUs.js";
import FaqModel from "../src/models/faq.js";

const uri = process.env.NEW_DB_URL || process.env.MONGO_URI;
if (!uri) {
  console.error("NEW_DB_URL is not set in api/.env");
  process.exit(1);
}

const img = (file: string) => `/images/products/${file}`;

const categories = [
  { name: "Earrings", slug: "earrings", image: img("silver-earrings.webp"), description: "Everyday studs to occasion statement pieces.", order: 6 },
  { name: "Necklaces", slug: "necklaces", image: img("layered-necklace.webp"), description: "Layered silver and pearl necklaces.", order: 5 },
  { name: "Chains", slug: "chains", image: img("cuban-chain.webp"), description: "Sterling silver chains for every day.", order: 4 },
  { name: "Bangles & Bracelets", slug: "bangles-bracelets", image: img("silver-bangle.webp"), description: "Hand-finished silver bangles and bracelets.", order: 3 },
  { name: "Anklets", slug: "anklets", image: img("payal-anklet.webp"), description: "Payal and anklets with a soft chime.", order: 2 },
  { name: "Waist Chains", slug: "waist-chains", image: img("dori-waist-chain.webp"), description: "Kamarbandh and dori-style waist chains.", order: 1 },
];

const subCategories = [
  { name: "Silver Chains for Men", slug: "silver-chains-for-men", category: "chains", image: img("desire-chain.webp") },
  { name: "Pearl Necklaces", slug: "pearl-necklaces", category: "necklaces", image: img("pearl-necklace.webp") },
  { name: "Stud Earrings", slug: "stud-earrings", category: "earrings", image: img("silver-earrings.webp") },
  { name: "Silver Bangles", slug: "silver-bangles", category: "bangles-bracelets", image: img("silver-bangle.webp") },
  { name: "Payal & Anklets", slug: "payal-anklets", category: "anklets", image: img("payal-anklet.webp") },
  { name: "Kamarbandh", slug: "kamarbandh", category: "waist-chains", image: img("silver-kamarbandh.webp") },
];

const colors = [
  { name: "Silver", code: "#C0C0C0", order: 4 },
  { name: "Rose Gold", code: "#B76E79", order: 3 },
  { name: "Champagne Gold", code: "#D8C096", order: 2 },
  { name: "Oxidised", code: "#5A5A5A", order: 1 },
];

const materials = [
  { name: "925 Sterling Silver", order: 5 },
  { name: "Sterling Silver with Pearls", order: 4 },
  { name: "Rhodium Plated Silver", order: 3 },
  { name: "Oxidised Silver", order: 2 },
  { name: "Gold Plated", order: 1 },
];

type SeedProduct = {
  slug: string;
  name: string;
  image: string;
  gallery?: string[];
  category: string;
  subCategory: string;
  price: number;
  discount_price: number;
  code: string;
  weight: string;
  description: string;
  tags: string[];
  colors: string[];
  materials: string[];
  flags?: Partial<Record<"isNewArrival" | "isBestSeller" | "isUpsell" | "isFeatured" | "isTopRated" | "isGift", boolean>>;
  stock?: number;
};

const products: SeedProduct[] = [
  {
    slug: "cuban-link-silver-chain",
    name: "Cuban Link Silver Chain",
    image: "cuban-chain.webp",
    gallery: ["cuban-chain.webp", "box-chain.webp"],
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 2499,
    discount_price: 1999,
    code: "JB-1001",
    weight: "18 g",
    description:
      "A bold Cuban-link chain in solid 925 sterling silver, polished to a high shine. Weighted for a confident drape and finished with a secure lobster clasp.",
    tags: ["chain", "men", "cuban", "silver"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isBestSeller: true, isFeatured: true },
  },
  {
    slug: "great-desire-sterling-chain",
    name: "Great Desire Sterling Chain",
    image: "desire-chain.webp",
    gallery: ["desire-chain.webp", "simple-chain.webp"],
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 1899,
    discount_price: 1499,
    code: "JB-1002",
    weight: "14 g",
    description:
      "A close-fitting sterling silver chain with a softly rounded profile — the everyday layer that works alone or under a pendant.",
    tags: ["chain", "minimal", "silver"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isNewArrival: true },
  },
  {
    slug: "love-forever-silver-chain",
    name: "Love Forever Silver Chain",
    image: "love-forever-chain.webp",
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 1599,
    discount_price: 1199,
    code: "JB-1003",
    weight: "12 g",
    description:
      "Delicate links with a romantic hand-polished finish, made to be worn daily and gifted often.",
    tags: ["chain", "gift", "silver"],
    colors: ["Silver", "Rose Gold"],
    materials: ["Rhodium Plated Silver"],
    flags: {}
  },
  {
    slug: "pearl-necklace-on-knit",
    name: "Pearl Strand Necklace",
    image: "pearl-necklace.webp",
    gallery: ["pearl-necklace.webp", "layered-necklace.webp"],
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 3299,
    discount_price: 2699,
    code: "JB-1004",
    weight: "22 g",
    description:
      "Freshwater pearls strung by hand on a fine silver chain, with a soft lustre that reads beautifully against cashmere and linen.",
    tags: ["pearl", "necklace", "classic"],
    colors: ["Silver"],
    materials: ["Sterling Silver with Pearls"],
    flags: { isBestSeller: true, isFeatured: true },
  },
  {
    slug: "box-design-silver-chain",
    name: "Box Design Silver Chain",
    image: "box-chain.webp",
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 2199,
    discount_price: 1749,
    code: "JB-1005",
    weight: "16 g",
    description:
      "Crisp box links catch the light from every angle. A modern chain that layers well with pearls and pendants.",
    tags: ["chain", "box", "modern"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isUpsell: true },
  },
  {
    slug: "minimal-silver-chain",
    name: "Minimal Silver Chain",
    image: "simple-chain.webp",
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 1299,
    discount_price: 999,
    code: "JB-1006",
    weight: "10 g",
    description:
      "Fine, featherweight links for a barely-there layer. Perfect for a first silver piece.",
    tags: ["chain", "minimal"],
    colors: ["Silver", "Champagne Gold"],
    materials: ["Rhodium Plated Silver"],
    flags: { isNewArrival: true },
  },
  {
    slug: "trendy-minimal-chain",
    name: "Trendy Minimal Chain",
    image: "trendy-chain.webp",
    category: "chains",
    subCategory: "silver-chains-for-men",
    price: 1499,
    discount_price: 1099,
    code: "JB-1007",
    weight: "11 g",
    description:
      "An easy everyday chain with a slightly longer drape, finished with a slim clasp that sits flat.",
    tags: ["chain", "trendy"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isUpsell: true },
  },
  {
    slug: "tulsi-engraved-mala",
    name: "Tulsi Engraved Mala",
    image: "tulsi-mala.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 2799,
    discount_price: 2299,
    code: "JB-1008",
    weight: "26 g",
    description:
      "Hand-engraved sterling silver tulsi beads on a soft cord — a traditional mala with a quietly modern weight.",
    tags: ["mala", "tulsi", "traditional"],
    colors: ["Silver", "Oxidised"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true },
  },
  {
    slug: "pearl-connector-chain",
    name: "Pearl Connector Chain",
    image: "pearl-connector-chain.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 2599,
    discount_price: 2099,
    code: "JB-1009",
    weight: "15 g",
    description:
      "Small silver connectors punctuated with pearls — a delicate necklace that sits at the collarbone.",
    tags: ["pearl", "chain", "delicate"],
    colors: ["Silver"],
    materials: ["Sterling Silver with Pearls"],
    flags: { isNewArrival: true, isBestSeller: true },
  },
  {
    slug: "dori-style-waist-chain",
    name: "Dori Style Waist Chain",
    image: "dori-waist-chain.webp",
    category: "waist-chains",
    subCategory: "kamarbandh",
    price: 2199,
    discount_price: 1799,
    code: "JB-1010",
    weight: "20 g",
    description:
      "A soft dori-style waist chain in silver with a hand-knotted finish, designed to sit comfortably over saris and lehengas.",
    tags: ["waist chain", "kamarbandh", "bridal"],
    colors: ["Silver", "Champagne Gold"],
    materials: ["925 Sterling Silver"],
    flags: { isBestSeller: true },
  },
  {
    slug: "traditional-silver-kamarbandh",
    name: "Traditional Silver Kamarbandh",
    image: "silver-kamarbandh.webp",
    category: "waist-chains",
    subCategory: "kamarbandh",
    price: 4599,
    discount_price: 3899,
    code: "JB-1011",
    weight: "48 g",
    description:
      "An ornate kamarbandh set with colourful stones, inspired by Rajasthani bridal jewellery and finished by hand.",
    tags: ["kamarbandh", "bridal", "statement"],
    colors: ["Silver", "Rose Gold"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true, isUpsell: true, isBestSeller: true },
  },
  {
    slug: "heart-toe-rings",
    name: "Heart Toe Rings with Gemstone",
    image: "heart-toe-rings.png",
    category: "anklets",
    subCategory: "payal-anklets",
    price: 899,
    discount_price: 699,
    code: "JB-1012",
    weight: "6 g",
    description:
      "A pair of heart-shaped silver toe rings set with a single gemstone — light enough to forget you're wearing them.",
    tags: ["toe ring", "silver", "gift"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isNewArrival: true },
  },
  {
    slug: "gemstone-toe-rings",
    name: "Gemstone Toe Ring Pair",
    image: "gemstone-toe-rings.png",
    category: "anklets",
    subCategory: "payal-anklets",
    price: 799,
    discount_price: 599,
    code: "JB-1013",
    weight: "5 g",
    description:
      "Classic silver toe rings with a smooth comfort-fit band and a small gemstone accent.",
    tags: ["toe ring", "classic"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
  },
  {
    slug: "payal-silver-anklet",
    name: "Payal Silver Anklet",
    image: "payal-anklet.webp",
    category: "anklets",
    subCategory: "payal-anklets",
    price: 1899,
    discount_price: 1499,
    code: "JB-1014",
    weight: "24 g",
    description:
      "A fine payal with tiny silver bells that chime softly as you walk. Adjustable length with a secure hook.",
    tags: ["anklet", "payal", "bells"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isBestSeller: true },
  },
  {
    slug: "classic-silver-bangle",
    name: "Classic Silver Bangle",
    image: "silver-bangle.webp",
    category: "bangles-bracelets",
    subCategory: "silver-bangles",
    price: 2399,
    discount_price: 1899,
    code: "JB-1015",
    weight: "28 g",
    description:
      "A smooth, rounded silver bangle with a soft interior polish — the one you never take off.",
    tags: ["bangle", "classic", "silver"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true, isUpsell: true },
  },
  {
    slug: "silver-chain-bracelet",
    name: "Silver Chain Bracelet",
    image: "silver-bracelet.webp",
    category: "bangles-bracelets",
    subCategory: "silver-bangles",
    price: 1699,
    discount_price: 1299,
    code: "JB-1016",
    weight: "12 g",
    description:
      "A fine chain bracelet with an adjustable slider clasp, made to stack with everything else in your drawer.",
    tags: ["bracelet", "chain", "stacking"],
    colors: ["Silver"],
    materials: ["Rhodium Plated Silver"],
    flags: { isNewArrival: true },
  },
  {
    slug: "classic-silver-earrings",
    name: "Classic Silver Earrings",
    image: "silver-earrings.webp",
    category: "earrings",
    subCategory: "stud-earrings",
    price: 1199,
    discount_price: 949,
    code: "JB-1017",
    weight: "7 g",
    description:
      "Everyday silver studs with a gently domed face, light on the lobe and easy to pair with anything.",
    tags: ["earrings", "studs", "everyday"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isBestSeller: true, isFeatured: true },
  },
  {
    slug: "evil-eye-bracelet",
    name: "Evil Eye Silver Bracelet",
    image: "evil-eye-bracelet.webp",
    category: "bangles-bracelets",
    subCategory: "silver-bangles",
    price: 1399,
    discount_price: 1099,
    code: "JB-1018",
    weight: "9 g",
    description:
      "A tiny evil-eye charm on a fine silver bracelet — a small talisman, quietly made.",
    tags: ["bracelet", "evil eye", "gift"],
    colors: ["Silver", "Rose Gold"],
    materials: ["Rhodium Plated Silver"],
    flags: { isUpsell: true },
  },
  {
    slug: "silver-mangalsutra",
    name: "Silver Mangalsutra",
    image: "silver-mangalsutra.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 3499,
    discount_price: 2899,
    code: "JB-1019",
    weight: "20 g",
    description:
      "A modern silver mangalsutra with a slim chain and a single black bead pendant, finished for everyday wear.",
    tags: ["mangalsutra", "bridal", "silver"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true },
  },
  {
    slug: "silver-nose-pin",
    name: "Silver Nose Pin",
    image: "nose-pin.webp",
    category: "earrings",
    subCategory: "stud-earrings",
    price: 599,
    discount_price: 499,
    code: "JB-1020",
    weight: "3 g",
    description:
      "A delicate nose pin with a tiny silver flower, made with a smooth push-back post.",
    tags: ["nose pin", "silver", "delicate"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
  },
  {
    slug: "silver-locket-pendant",
    name: "Silver Locket Pendant",
    image: "silver-pendant.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 1599,
    discount_price: 1249,
    code: "JB-1021",
    weight: "8 g",
    description:
      "A small silver locket with a hand-etched border, ready to hold a photograph or a folded note.",
    tags: ["pendant", "locket", "gift"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isUpsell: true },
  },
  {
    slug: "minimal-silver-ring",
    name: "Minimal Silver Ring",
    image: "silver-ring.webp",
    category: "bangles-bracelets",
    subCategory: "silver-bangles",
    price: 899,
    discount_price: 699,
    code: "JB-1022",
    weight: "4 g",
    description:
      "A slim silver band with a soft hammered texture — simple enough to wear on any finger.",
    tags: ["ring", "minimal"],
    colors: ["Silver", "Champagne Gold"],
    materials: ["925 Sterling Silver"],
  },
  {
    slug: "bridal-silver-set",
    name: "Bridal Silver Set",
    image: "bridal-set.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 8999,
    discount_price: 7499,
    code: "JB-1023",
    weight: "96 g",
    description:
      "A statement bridal set in silver with matching earrings, finished with hand-set stones for the wedding day.",
    tags: ["bridal", "set", "statement"],
    colors: ["Silver", "Rose Gold"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true, isBestSeller: true },
  },
  {
    slug: "layered-silver-necklace",
    name: "Layered Silver Necklace",
    image: "layered-necklace.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 2899,
    discount_price: 2399,
    code: "JB-1024",
    weight: "18 g",
    description:
      "Three fine silver layers joined at a single clasp, so the stacking is already done for you.",
    tags: ["necklace", "layered", "trending"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isUpsell: true, isNewArrival: true },
  },
  {
    slug: "statement-silver-necklace",
    name: "Statement Silver Necklace",
    image: "statement-necklace.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 4299,
    discount_price: 3599,
    code: "JB-1025",
    weight: "34 g",
    description:
      "An architectural silver necklace with a bold silhouette, designed for evenings and celebrations.",
    tags: ["necklace", "statement"],
    colors: ["Silver"],
    materials: ["925 Sterling Silver"],
    flags: { isFeatured: true, isUpsell: true },
  },
  {
    slug: "gold-plated-layered-necklace",
    name: "Gold Plated Layered Necklace",
    image: "layered-necklace.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 2499,
    discount_price: 1999,
    code: "JB-1026",
    weight: "14 g",
    description:
      "Warm gold plating over a fine silver base, layered into a single easy clasp for an effortless everyday stack.",
    tags: ["gold", "necklace", "layered"],
    colors: ["Champagne Gold"],
    materials: ["Gold Plated"],
    flags: { isGift: true, isNewArrival: true },
  },
  {
    slug: "gold-plated-statement-necklace",
    name: "Gold Plated Statement Necklace",
    image: "statement-necklace.webp",
    category: "necklaces",
    subCategory: "pearl-necklaces",
    price: 4499,
    discount_price: 3699,
    code: "JB-1027",
    weight: "30 g",
    description:
      "A sculptural gold-plated necklace with a soft satin finish, made to be the only piece you need at an evening do.",
    tags: ["gold", "necklace", "statement", "gift"],
    colors: ["Champagne Gold"],
    materials: ["Gold Plated"],
    flags: { isGift: true, isBestSeller: true },
  },
  {
    slug: "gold-plated-everyday-hoops",
    name: "Gold Plated Everyday Hoops",
    image: "silver-earrings.webp",
    category: "earrings",
    subCategory: "stud-earrings",
    price: 1299,
    discount_price: 999,
    code: "JB-1028",
    weight: "6 g",
    description:
      "Lightweight gold-plated hoops with a softly rounded edge — the pair that quietly finishes every outfit.",
    tags: ["gold", "hoops", "everyday", "gift"],
    colors: ["Champagne Gold"],
    materials: ["Gold Plated"],
    flags: { isGift: true },
  },
  {
    slug: "gold-plated-chain-bracelet",
    name: "Gold Plated Chain Bracelet",
    image: "silver-bracelet.webp",
    category: "bangles-bracelets",
    subCategory: "silver-bangles",
    price: 1799,
    discount_price: 1399,
    code: "JB-1029",
    weight: "10 g",
    description:
      "A polished gold-plated chain bracelet that sits close to the wrist, ready to be stacked or worn solo.",
    tags: ["gold", "bracelet", "gift"],
    colors: ["Champagne Gold"],
    materials: ["Gold Plated"],
    flags: { isGift: true, isNewArrival: true },
  },
].map((p) => ({ ...p, stock: p.stock ?? 12 }));

const testimonials = [
  {
    title: "Ananya Sharma",
    description:
      "The pearl strand is even more beautiful in person. It arrived in a lovely box and the finish is perfect for everyday wear.",
    rating: 5,
    image: img("pearl-necklace.webp"),
    address: "Jaipur, Rajasthan",
  },
  {
    title: "Riya Mehta",
    description:
      "I ordered the kamarbandh for my sister's wedding and it was the most complimented piece of the evening.",
    rating: 5,
    image: img("silver-kamarbandh.webp"),
    address: "Udaipur, Rajasthan",
  },
  {
    title: "Karan Singh",
    description:
      "The Cuban chain has a real weight to it. Packaging was neat and delivery was quicker than expected.",
    rating: 4,
    image: img("cuban-chain.webp"),
    address: "Jodhpur, Rajasthan",
  },
  {
    title: "Meera Iyer",
    description:
      "Bought the silver studs as a gift. The quality of the finish is lovely and they haven't dulled after weeks of daily wear.",
    rating: 5,
    image: img("silver-earrings.webp"),
    address: "Bengaluru, Karnataka",
  },
];

const whyChooseUs = [
  {
    title: "925 Sterling Silver",
    description:
      "Every piece is made from hallmarked 925 sterling silver, finished by hand in our workshop.",
    image: "ShieldCheck",
  },
  {
    title: "Made for Everyday",
    description:
      "Lightweight settings and comfort-fit clasps designed to be worn from morning to night.",
    image: "Sparkles",
  },
  {
    title: "Gift-Ready Packaging",
    description:
      "Each order arrives in a keepsake box with a polishing cloth and a handwritten note option.",
    image: "Gift",
  },
  {
    title: "Easy 15-Day Returns",
    description:
      "Changed your mind? Return any unworn piece within 15 days for a full refund.",
    image: "CheckCircle",
  },
];

const faqs = [
  {
    question: "Is your jewellery made of real silver?",
    answer:
      "Yes. All our pieces are crafted from 925 sterling silver and hallmarked. Pearl and gemstone pieces use freshwater pearls and natural stones.",
  },
  {
    question: "How should I care for my silver jewellery?",
    answer:
      "Keep silver away from perfume, chlorine and moisture. Store each piece in the pouch provided and polish gently with the included cloth.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders are dispatched within 24–48 hours and typically arrive in 5–7 business days across India.",
  },
  {
    question: "Do you offer cash on delivery?",
    answer:
      "Yes, cash on delivery is available on most pin codes. A 10% advance may be required for high-value orders.",
  },
  {
    question: "Can I return or exchange a piece?",
    answer:
      "Unworn pieces can be returned within 15 days of delivery. Personalised items are made to order and are not eligible for return.",
  },
  {
    question: "Will my order arrive gift wrapped?",
    answer:
      "Every order ships in signature packaging. You can add a gift message and premium gift wrap at checkout.",
  },
];

const banners = [
  {
    image: img("bridal-set.webp"),
    description: "The bridal edit — hand-set silver for the wedding day.",
    order: 3,
  },
  {
    image: img("layered-necklace.webp"),
    description: "New layers — fine silver necklaces for everyday.",
    order: 2,
  },
  {
    image: img("silver-earrings.webp"),
    description: "Everyday silver, quietly made.",
    order: 1,
  },
];

let created = 0;
let skipped = 0;

async function upsertOne(
  model: mongoose.Model<any>,
  filter: Record<string, unknown>,
  doc: Record<string, unknown>,
) {
  const existing = await model.findOne(filter).select("_id").lean();
  if (existing) {
    skipped += 1;
    return existing as { _id: mongoose.Types.ObjectId };
  }
  const inserted = await model.create(doc);
  created += 1;
  return inserted;
}

async function main() {
  await mongoose.connect(uri as string);
  console.log("connected");

  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const c of categories) {
    const row = await upsertOne(Category, { slug: c.slug }, { ...c, status: true });
    categoryIds.set(c.slug, row._id);
  }

  const subCategoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const s of subCategories) {
    const row = await upsertOne(SubCategory, { slug: s.slug }, {
      name: s.name,
      slug: s.slug,
      image: s.image,
      category: [categoryIds.get(s.category)],
      status: true,
    });
    subCategoryIds.set(s.slug, row._id);
  }

  const colorIds = new Map<string, mongoose.Types.ObjectId>();
  for (const c of colors) {
    const row = await upsertOne(ColorModel, { name: c.name }, { ...c, status: true });
    colorIds.set(c.name, row._id);
  }

  const materialIds = new Map<string, mongoose.Types.ObjectId>();
  for (const m of materials) {
    const row = await upsertOne(MaterialModel, { name: m.name }, { ...m, status: true });
    materialIds.set(m.name, row._id);
  }

  for (const p of products) {
    const gallery = (p.gallery ?? [p.image]).map(img);
    const flags = p.flags ?? {};
    await upsertOne(Product, { slug: p.slug }, {
      name: p.name,
      slug: p.slug,
      image: img(p.image),
      images: gallery,
      colors: p.colors.map((c) => colorIds.get(c)).filter(Boolean),
      material: p.materials.map((m) => materialIds.get(m)).filter(Boolean),
      category: [categoryIds.get(p.category)].filter(Boolean),
      subCategory: [subCategoryIds.get(p.subCategory)].filter(Boolean),
      description: p.description,
      shortDescription: p.description.slice(0, 110),
      weight: p.weight,
      type: "Jewellery",
      code: p.code,
      sku: p.code,
      price: p.price,
      discount_price: p.discount_price,
      stock: p.stock,
      estimated_delivery_time: "5-7 business days",
      status: "active",
      tags: p.tags,
      isNewArrival: !!flags.isNewArrival,
      isBestSeller: !!flags.isBestSeller,
      isUpsell: !!flags.isUpsell,
      isFeatured: !!flags.isFeatured,
      isTopRated: !!flags.isTopRated,
      isGift: !!flags.isGift,
      isOnSale: p.discount_price < p.price,
      rating: 4.6,
      reviewCount: 12 + (p.price % 7),
      order: 100 - p.price / 100,
    });
  }

  for (const t of testimonials) {
    await upsertOne(Testimonial, { title: t.title }, { ...t, status: true });
  }
  for (const w of whyChooseUs) {
    await upsertOne(WhyChooseUs, { title: w.title }, { ...w, status: true });
  }
  for (const f of faqs) {
    await upsertOne(FaqModel, { question: f.question }, { ...f, status: true });
  }
  for (const b of banners) {
    await upsertOne(BannerModel, { description: b.description }, { ...b, status: true });
  }

  console.log(`created=${created} skipped=${skipped}`);
  const counts = {
    categories: await Category.countDocuments(),
    subCategories: await SubCategory.countDocuments(),
    colors: await ColorModel.countDocuments(),
    materials: await MaterialModel.countDocuments(),
    products: await Product.countDocuments(),
    testimonials: await Testimonial.countDocuments(),
    whyChooseUs: await WhyChooseUs.countDocuments(),
    faqs: await FaqModel.countDocuments(),
    banners: await BannerModel.countDocuments(),
  };
  console.log(counts);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
