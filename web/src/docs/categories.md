# Jewellery Walla — Category Hierarchy

> Simplified category hierarchy for a jewellery e-commerce store.
> Categories are managed at runtime through the admin panel (`/dashboard/categories`).
> The legacy `scripts/seed-categories.js` seeder has been removed.

---

## Categories (Top Level)

| # | Name | Slug | Order | Description |
|---|------|------|-------|-------------|
| 1 | Rings | rings | 1 | Solitaires, couple rings, gold & silver rings |
| 2 | Necklaces | necklaces | 2 | Gold, silver, temple & layered necklaces |
| 3 | Earrings | earrings | 3 | Studs, drops & danglers, jhumkas, hoops |
| 4 | Bangles | bangles | 4 | Gold bangles, silver bangles, kadas |
| 5 | Bracelets | bracelets | 5 | Chain & beaded bracelets |
| 6 | Pendants & Chains | pendants-chains | 6 | Gold/silver chains and pendants |
| 7 | Mangalsutra | mangalsutra | 7 | Gold & diamond mangalsutra |
| 8 | Bridal Sets | bridal-sets | 8 | Necklace sets, earrings & bangles for brides |
| 9 | Men's Jewellery | mens-jewellery | 9 | Chains, rings & bracelets for men |
| 10 | Personalised Jewellery | personalised-jewellery | 10 | Name necklaces, initial rings, custom engraving |
| 11 | Gift Items | gift-items | 11 | Jewellery boxes & gift sets |

---

## Sub-Categories (Level 2)

### 1. Rings

| Name | Slug | Order |
|------|------|-------|
| Solitaire Rings | solitaire-rings | 1 |
| Couple Rings | couple-rings | 2 |
| Gold Rings | gold-rings | 3 |
| Silver Rings | silver-rings | 4 |

### 2. Necklaces

| Name | Slug | Order |
|------|------|-------|
| Gold Necklaces | gold-necklaces | 1 |
| Silver Necklaces | silver-necklaces | 2 |
| Temple Necklaces | temple-necklaces | 3 |
| Layered Necklaces | layered-necklaces | 4 |

### 3. Earrings

| Name | Slug | Order |
|------|------|-------|
| Studs | studs | 1 |
| Drops & Danglers | drops-danglers | 2 |
| Jhumkas | jhumkas | 3 |
| Hoops | hoops | 4 |

### 4. Bangles

| Name | Slug | Order |
|------|------|-------|
| Gold Bangles | gold-bangles | 1 |
| Silver Bangles | silver-bangles | 2 |
| Kada | kada | 3 |

### 5. Bracelets

| Name | Slug | Order |
|------|------|-------|
| Chain Bracelets | chain-bracelets | 1 |
| Beaded Bracelets | beaded-bracelets | 2 |

### 6. Pendants & Chains

| Name | Slug | Order |
|------|------|-------|
| Gold Chains | gold-chains | 1 |
| Silver Chains | silver-chains | 2 |
| Pendants | pendants | 3 |

### 7. Mangalsutra

| Name | Slug | Order |
|------|------|-------|
| Gold Mangalsutra | gold-mangalsutra | 1 |
| Diamond Mangalsutra | diamond-mangalsutra | 2 |

### 8. Bridal Sets

| Name | Slug | Order |
|------|------|-------|
| Bridal Necklace Sets | bridal-necklace-sets | 1 |
| Bridal Earrings | bridal-earrings | 2 |
| Bridal Bangles | bridal-bangles | 3 |

### 9. Men's Jewellery

| Name | Slug | Order |
|------|------|-------|
| Men's Chains | mens-chains | 1 |
| Men's Rings | mens-rings | 2 |
| Men's Bracelets | mens-bracelets | 3 |

### 10. Personalised Jewellery

| Name | Slug | Order |
|------|------|-------|
| Name Necklaces | name-necklaces | 1 |
| Initial Rings | initial-rings | 2 |
| Custom Engraving | custom-engraving | 3 |

### 11. Gift Items

| Name | Slug | Order |
|------|------|-------|
| Jewellery Boxes | jewellery-boxes | 1 |
| Jewellery Gift Sets | jewellery-gift-sets | 2 |

---

## Sub-Sub-Categories (Level 3)

| Parent Sub-Category | Name | Slug | Order |
|--------------------|------|------|-------|
| Solitaire Rings | Diamond Solitaires | diamond-solitaires | 1 |
| Solitaire Rings | Gold Solitaires | gold-solitaires | 2 |
| Jhumkas | Traditional Jhumkas | traditional-jhumkas | 1 |
| Jhumkas | Contemporary Jhumkas | contemporary-jhumkas | 2 |
| Gold Necklaces | Antique Gold Necklaces | antique-gold-necklaces | 1 |
| Gold Necklaces | Modern Gold Necklaces | modern-gold-necklaces | 2 |
| Men's Chains | Rope Chains | rope-chains | 1 |
| Men's Chains | Curb Chains | curb-chains | 2 |
| Men's Chains | Bold Link Chains | bold-link-chains | 3 |
| Jewellery Gift Sets | Birthday Gift Sets | birthday-gift-sets | 1 |
| Jewellery Gift Sets | Anniversary Gift Sets | anniversary-gift-sets | 2 |

---

## Notes

- The seeder relies on the API's slug generation, so names map to slugs
  automatically (dashes, lowercased, special characters stripped).
- All categories support sub-categories; only select branches define a
  third level (sub-sub-categories).
