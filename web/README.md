# Jewellery Walla - E-commerce Website

Premium jewellery store in Jodhpur offering exquisite gold, silver, and diamond jewellery.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SEO Implementation ✅

This website has been fully optimized for SEO with comprehensive features.

### Implemented Features:

1. ✅ SEO Configuration in `/src/lib/utils.js`
2. ✅ Structured Data (JSON-LD) for Organization and Website
3. ✅ Comprehensive metadata for all pages
4. ✅ Open Graph and Twitter Card tags
5. ✅ Geo-location metadata for local SEO
6. ✅ Canonical URLs
7. ✅ Robots meta tags

### Required Manual File Creation:

#### 1. Create `.env.example` (Root directory)

```env
# Business Information
NEXT_PUBLIC_BUSINESS_NAME=Jewellery Walla
NEXT_PUBLIC_BUSINESS_LEGAL_NAME=Jewellery Walla Private Limited
NEXT_PUBLIC_BUSINESS_DESCRIPTION=Premium jewellery store in Jodhpur offering exquisite gold, silver, and diamond jewellery for men and women. Discover unique designs and traditional craftsmanship.

# Contact Information
NEXT_PUBLIC_BUSINESS_EMAIL=info@jewellerywalla.com
NEXT_PUBLIC_BUSINESS_PHONE=+91-291-1234567
NEXT_PUBLIC_BUSINESS_MOBILE=+91-9876543210
NEXT_PUBLIC_BUSINESS_WHATSAPP=+919876543210

# Address Information
NEXT_PUBLIC_BUSINESS_ADDRESS_STREET=123, Clock Tower Road
NEXT_PUBLIC_BUSINESS_ADDRESS_LOCALITY=Sojati Gate
NEXT_PUBLIC_BUSINESS_ADDRESS_CITY=Jodhpur
NEXT_PUBLIC_BUSINESS_ADDRESS_STATE=Rajasthan
NEXT_PUBLIC_BUSINESS_ADDRESS_POSTAL_CODE=342001
NEXT_PUBLIC_BUSINESS_ADDRESS_COUNTRY=India

# Website Information
NEXT_PUBLIC_SITE_URL=https://www.jewellerywalla.com
NEXT_PUBLIC_SITE_DOMAIN=jewellerywalla.com

# Social Media
NEXT_PUBLIC_SOCIAL_FACEBOOK=https://facebook.com/jewellerywalla
NEXT_PUBLIC_SOCIAL_INSTAGRAM=https://instagram.com/jewellerywalla
NEXT_PUBLIC_SOCIAL_TWITTER=https://twitter.com/jewellerywalla
NEXT_PUBLIC_SOCIAL_PINTEREST=https://pinterest.com/jewellerywalla
NEXT_PUBLIC_SOCIAL_YOUTUBE=https://youtube.com/@jewellerywalla

# Business Hours
NEXT_PUBLIC_BUSINESS_HOURS_WEEKDAY=10:00 AM - 8:00 PM
NEXT_PUBLIC_BUSINESS_HOURS_WEEKEND=10:00 AM - 9:00 PM

# SEO
NEXT_PUBLIC_BUSINESS_FOUNDED_YEAR=2020
NEXT_PUBLIC_BUSINESS_PRICE_RANGE=₹₹₹

# Google Services (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

#### 2. Create `src/app/robots.js`

```javascript
import { siteConfig } from "@/lib/utils";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account-details",
          "/profile",
          "/checkout",
          "/reset-password",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

#### 3. Create `src/app/sitemap.js`

```javascript
import { siteConfig } from "@/lib/utils";

export default function sitemap() {
  const baseUrl = siteConfig.url;

  const routes = [
    "",
    "/about",
    "/contact",
    "/faq",
    "/story",
    "/our-policy",
    "/terms-and-condition",
    "/product-listing",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
```

#### 4. Create `public/site.webmanifest`

```json
{
  "name": "Jewellery Walla",
  "short_name": "JW",
  "description": "Premium jewellery store in Jodhpur",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ca8a04",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Environment Setup:

1. Copy `.env.example` to `.env.local`
2. Update all values with your actual business information
3. Never commit `.env.local` to version control

### SEO Checklist:

- ✅ Meta titles and descriptions on all pages
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card tags
- ✅ Structured data (JSON-LD) for Organization and Website
- ✅ Canonical URLs
- ✅ Geo-location tags for local SEO
- ✅ Keywords optimization
- ⏳ Create `robots.js` file (see above)
- ⏳ Create `sitemap.js` file (see above)
- ⏳ Create `site.webmanifest` file (see above)
- ⏳ Add favicon and app icons (192x192, 512x512)
- ⏳ Create Open Graph image (`public/og-image.jpg` - 1200x630px)
- ⏳ Add Google Analytics (optional)
- ⏳ Add Google Search Console verification

### Local SEO Optimization:

- Business location: Jodhpur, Rajasthan
- Geo-coordinates: 26.2389, 73.0243
- Local keywords included in metadata
- Google My Business listing recommended

### SEO Testing:

After deployment, test your SEO with:

- Google Search Console
- Google Rich Results Test
- PageSpeed Insights
- Mobile-Friendly Test
- Schema.org Validator
