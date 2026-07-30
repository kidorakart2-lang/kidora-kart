export interface BentoCell {
  image: string
  title: string
  subtitle: string
  linkType: string
  linkTarget: string
  linkExternalUrl: string
  productId?: string
  sourceId?: string
  sourceType?: string
}

export interface SectionConfig {
  heading?: string
  productSource?: string
  limit?: string
  searchTerms?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
  html?: string
  bgColor?: string
  hidden?: boolean
  bannerMode?: "single" | "slider"
  selectedBannerIds?: string[]
  bannerSearch?: string
  selectedBannerId?: string
  bannerImage?: string
  videoUrl?: string
  layout?: string
  cells?: BentoCell[]
  // Category grid config
  // Shop by price config
  ranges?: { label: string; min: number; max: number }[]
  // Category grid config
  categorySourceType?: "category" | "subCategory" | "subSubCategory"
  categorySelectedIds?: string[]
  categorySearch?: string
  categoryItems?: { _id: string; name: string; image?: string; slug?: string }[]
  [key: string]: unknown
}

export interface HomeSection {
  _id: string
  type: string
  config?: SectionConfig
  order: number
}
