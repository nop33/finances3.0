export type CategoryTier = 'need' | 'want' | 'gifting' | 'savings'

export interface Subcategory {
  name: string
  tier: CategoryTier
}

export interface Category {
  name: string
  subcategories: Subcategory[]
}

export const CATEGORIES: Category[] = [
  {
    name: 'Food',
    subcategories: [
      { name: 'Groceries', tier: 'need' },
      { name: 'Restaurants', tier: 'want' }
    ]
  },
  {
    name: 'Home',
    subcategories: [
      { name: 'Rent', tier: 'need' },
      { name: 'Genossenschaft', tier: 'want' },
      { name: 'Cleaning', tier: 'want' },
      { name: 'Internet', tier: 'need' },
      { name: 'Utilities', tier: 'need' },
      { name: 'Electricity', tier: 'need' },
      { name: 'Serafe', tier: 'need' }
    ]
  },
  {
    name: 'Transport',
    subcategories: [
      { name: 'SBB', tier: 'need' },
      { name: 'Public Transport', tier: 'need' },
      { name: 'Uber/Taxi', tier: 'need' },
      { name: 'Parking', tier: 'need' },
      { name: 'Speed Tickets', tier: 'need' }
    ]
  },
  {
    name: 'Security',
    subcategories: [
      { name: 'Privathaftpflicht', tier: 'need' },
      { name: 'Hausrat', tier: 'need' },
      { name: 'VPN', tier: 'need' },
      { name: 'Password Manager', tier: 'need' },
      { name: 'Safe Deposit', tier: 'need' },
      { name: 'Backblaze', tier: 'need' },
      { name: 'Google One', tier: 'need' }
    ]
  },
  { name: 'Work', subcategories: [{ name: 'Dev Tools', tier: 'need' }] },
  {
    name: 'Telecommunications',
    subcategories: [
      { name: 'Swiss Phone', tier: 'need' },
      { name: 'eSIM', tier: 'want' }
    ]
  },
  {
    name: 'Admin/Fees',
    subcategories: [
      { name: 'Bank Fees', tier: 'need' },
      { name: 'Card Fees', tier: 'need' }
    ]
  },
  {
    name: 'Health',
    subcategories: [
      { name: 'Krankenkasse', tier: 'need' },
      { name: 'Gym', tier: 'need' },
      { name: 'Yoga', tier: 'need' },
      { name: 'Psychology', tier: 'need' },
      { name: 'Medicine', tier: 'need' },
      { name: 'Dental', tier: 'need' },
      { name: 'Supplements', tier: 'need' }
    ]
  },
  {
    name: 'Wellness',
    subcategories: [
      { name: 'Spa', tier: 'want' },
      { name: 'Haircut', tier: 'need' }
    ]
  },
  {
    name: 'Hobbies',
    subcategories: [
      { name: 'Sports', tier: 'want' },
      { name: 'Music', tier: 'want' },
      { name: 'Gaming', tier: 'want' },
      { name: 'Domains', tier: 'want' },
      { name: 'Spotify', tier: 'want' }
    ]
  },
  {
    name: 'Shopping',
    subcategories: [
      { name: 'Clothes', tier: 'want' },
      { name: 'Gadgets', tier: 'want' },
      { name: 'Other', tier: 'want' }
    ]
  },
  {
    name: 'Traveling',
    subcategories: [
      { name: 'Flights', tier: 'want' },
      { name: 'Accommodation', tier: 'want' },
      { name: 'Transport', tier: 'want' },
      { name: 'Other', tier: 'want' }
    ]
  },
  {
    name: 'Education',
    subcategories: [
      { name: 'Books', tier: 'want' },
      { name: 'Courses', tier: 'want' },
      { name: 'Language', tier: 'want' },
      { name: 'AI Tools', tier: 'want' }
    ]
  },
  {
    name: 'Recreation',
    subcategories: [
      { name: 'Festivals', tier: 'want' },
      { name: 'Concerts', tier: 'want' },
      { name: 'Cinema', tier: 'want' },
      { name: 'Streaming', tier: 'want' }
    ]
  },
  {
    name: 'Gifts/Donations',
    subcategories: [
      { name: 'Family', tier: 'gifting' },
      { name: 'General', tier: 'gifting' },
      { name: 'Donations', tier: 'gifting' }
    ]
  },
  { name: 'Personal/3rd Pillar', subcategories: [{ name: 'VIAC', tier: 'savings' }] }
]
