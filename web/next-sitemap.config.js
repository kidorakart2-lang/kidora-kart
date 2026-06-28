// @ts-check

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://jewellerywalla.com",
  generateRobotsTxt: false, // Using Next.js app router's robots.js instead
  exclude: ["/server-sitemap.xml", "/admin/*", "/api/*"],
  generateIndexSitemap: true,
  outDir: "public",
};

module.exports = config;
