// @ts-check

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://jewellerywalla.com",
  generateRobotsTxt: false, // Using Next.js app router's robots.js instead
  exclude: ["/server-sitemap.xml", "/admin/*", "/api/*"],
  generateIndexSitemap: true,
  outDir: "public",
  additionalPaths: async () => [
    { loc: "/contact-us", changefreq: "monthly", priority: 0.6 },
    { loc: "/faq", changefreq: "weekly", priority: 0.7 },
    { loc: "/our-policy", changefreq: "monthly", priority: 0.5 },
    { loc: "/order-track", changefreq: "weekly", priority: 0.5 },
    { loc: "/cart", changefreq: "never", priority: 0.3 },
    { loc: "/checkout", changefreq: "never", priority: 0.3 },
  ],
};

module.exports = config;
