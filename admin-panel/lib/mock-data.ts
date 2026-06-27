/** Mock user entity */
export interface MockUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  createdAt: string;
}

/** Mock product entity */
export interface MockProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  image: string;
  sku: string;
}

/** Mock order entity */
export interface MockOrder {
  id: number;
  customer: string;
  total: number;
  status: string;
  items: number;
  date: string;
  paymentMethod: string;
}

/** Mock category entity */
export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  status: string;
  image: string;
}

/** Mock banner entity */
export interface MockBanner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  status: string;
  position: number;
}

/** Mock testimonial entity */
export interface MockTestimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  status: string;
}

/** Mock FAQ entity */
export interface MockFAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  status: string;
  order: number;
}

/** Mock why-choose-us entity */
export interface MockWhyChooseUs {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: string;
  order: number;
}

/** Mock material entity */
export interface MockMaterial {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: string;
}

/** Mock color entity */
export interface MockColor {
  id: number;
  name: string;
  hex: string;
  status: string;
}

/** Mock dashboard stats */
export interface MockStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
  productsChange: number;
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    status: "active",
    avatar: "/abstract-geometric-shapes.png",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    status: "active",
    avatar: "/abstract-geometric-shapes.png",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "user",
    status: "inactive",
    avatar: "/abstract-geometric-shapes.png",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    name: "Alice Williams",
    email: "alice@example.com",
    role: "moderator",
    status: "active",
    avatar: "/abstract-geometric-shapes.png",
    createdAt: "2024-01-25",
  },
  {
    id: 5,
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "user",
    status: "active",
    avatar: "/abstract-geometric-shapes.png",
    createdAt: "2024-04-05",
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 299.99,
    stock: 45,
    category: "Electronics",
    status: "active",
    image: "/diverse-people-listening-headphones.png",
    sku: "ELEC-001",
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 49.99,
    stock: 120,
    category: "Electronics",
    status: "active",
    image: "/field-mouse.png",
    sku: "ELEC-002",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    price: 159.99,
    stock: 0,
    category: "Electronics",
    status: "out_of_stock",
    image: "/mechanical-keyboard.png",
    sku: "ELEC-003",
  },
  {
    id: 4,
    name: "USB-C Cable",
    price: 19.99,
    stock: 200,
    category: "Accessories",
    status: "active",
    image: "/tangled-cables.png",
    sku: "ACC-001",
  },
  {
    id: 5,
    name: "Laptop Stand",
    price: 79.99,
    stock: 35,
    category: "Accessories",
    status: "active",
    image: "/simple-wooden-stand.png",
    sku: "ACC-002",
  },
];

export const mockOrders: MockOrder[] = [
  {
    id: 1001,
    customer: "John Doe",
    total: 349.98,
    status: "delivered",
    items: 2,
    date: "2024-10-01",
    paymentMethod: "Credit Card",
  },
  {
    id: 1002,
    customer: "Jane Smith",
    total: 159.99,
    status: "processing",
    items: 1,
    date: "2024-10-05",
    paymentMethod: "PayPal",
  },
  {
    id: 1003,
    customer: "Bob Johnson",
    total: 99.97,
    status: "shipped",
    items: 3,
    date: "2024-10-03",
    paymentMethod: "Credit Card",
  },
  {
    id: 1004,
    customer: "Alice Williams",
    total: 299.99,
    status: "pending",
    items: 1,
    date: "2024-10-06",
    paymentMethod: "Debit Card",
  },
  {
    id: 1005,
    customer: "Charlie Brown",
    total: 79.99,
    status: "delivered",
    items: 1,
    date: "2024-09-28",
    paymentMethod: "Credit Card",
  },
];

export const mockCategories: MockCategory[] = [
  {
    id: 1,
    name: "Electronics",
    slug: "electronics",
    productCount: 156,
    status: "active",
    image: "/electronics-components.png",
  },
  {
    id: 2,
    name: "Accessories",
    slug: "accessories",
    productCount: 89,
    status: "active",
    image: "/fashion-accessories-flatlay.png",
  },
  {
    id: 3,
    name: "Clothing",
    slug: "clothing",
    productCount: 234,
    status: "active",
    image: "/diverse-clothing-rack.png",
  },
  {
    id: 4,
    name: "Home & Garden",
    slug: "home-garden",
    productCount: 67,
    status: "active",
    image: "/cozy-cabin-interior.png",
  },
];

export const mockBanners: MockBanner[] = [
  {
    id: 1,
    title: "Summer Sale",
    subtitle: "Up to 50% off",
    image: "/summer-sale-display.png",
    link: "/sale",
    status: "active",
    position: 1,
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Check out our latest products",
    image: "/new-products-display.png",
    link: "/new",
    status: "active",
    position: 2,
  },
  {
    id: 3,
    title: "Free Shipping",
    subtitle: "On orders over $50",
    image: "/global-shipping-network.png",
    link: "/shipping",
    status: "inactive",
    position: 3,
  },
];

export const mockTestimonials: MockTestimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "CEO, TechCorp",
    content: "Amazing products and excellent customer service!",
    rating: 5,
    avatar: "/diverse-woman-portrait.png",
    status: "active",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Designer",
    content: "The quality exceeded my expectations. Highly recommended!",
    rating: 5,
    avatar: "/man.jpg",
    status: "active",
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Developer",
    content: "Fast delivery and great packaging. Will order again!",
    rating: 4,
    avatar: "/diverse-woman-portrait.png",
    status: "active",
  },
];

export const mockFAQs: MockFAQ[] = [
  {
    id: 1,
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for all products.",
    category: "Returns",
    status: "active",
    order: 1,
  },
  {
    id: 2,
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5-7 business days.",
    category: "Shipping",
    status: "active",
    order: 2,
  },
  {
    id: 3,
    question: "Do you ship internationally?",
    answer: "Yes, we ship to over 50 countries worldwide.",
    category: "Shipping",
    status: "active",
    order: 3,
  },
  {
    id: 4,
    question: "How can I track my order?",
    answer: "You will receive a tracking number via email once your order ships.",
    category: "Orders",
    status: "active",
    order: 4,
  },
];

export const mockWhyChooseUs: MockWhyChooseUs[] = [
  {
    id: 1,
    title: "Fast Shipping",
    description: "Get your orders delivered quickly",
    icon: "truck",
    status: "active",
    order: 1,
  },
  {
    id: 2,
    title: "Quality Products",
    description: "We only sell the best quality items",
    icon: "star",
    status: "active",
    order: 2,
  },
  {
    id: 3,
    title: "24/7 Support",
    description: "Our team is always here to help",
    icon: "headset",
    status: "active",
    order: 3,
  },
  {
    id: 4,
    title: "Secure Payment",
    description: "Your payment information is safe",
    icon: "shield",
    status: "active",
    order: 4,
  },
];

export const mockMaterials: MockMaterial[] = [
  { id: 1, name: "Cotton", slug: "cotton", description: "Soft and breathable fabric", status: "active" },
  { id: 2, name: "Polyester", slug: "polyester", description: "Durable synthetic material", status: "active" },
  { id: 3, name: "Leather", slug: "leather", description: "Premium natural material", status: "active" },
  { id: 4, name: "Metal", slug: "metal", description: "Strong and long-lasting", status: "active" },
];

export const mockColors: MockColor[] = [
  { id: 1, name: "Black", hex: "#000000", status: "active" },
  { id: 2, name: "White", hex: "#FFFFFF", status: "active" },
  { id: 3, name: "Red", hex: "#FF0000", status: "active" },
  { id: 4, name: "Blue", hex: "#0000FF", status: "active" },
  { id: 5, name: "Green", hex: "#00FF00", status: "active" },
];

export const mockStats: MockStats = {
  totalRevenue: 125430,
  totalOrders: 1247,
  totalUsers: 3456,
  totalProducts: 567,
  revenueChange: 12.5,
  ordersChange: 8.3,
  usersChange: 15.2,
  productsChange: 5.7,
};
