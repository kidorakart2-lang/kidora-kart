// @ts-check

/** @type {import('@lhci/types').LHCI.Config} */
const config = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "ready started server",
      url: [
        "http://localhost:3000",
        // "http://localhost:3000/category/necklaces",
        // "http://localhost:3000/category/rings",
        // "http://localhost:3000/faq",
        // "http://localhost:3000/about-us",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci_reports",
    },
  },
};

module.exports = config;
