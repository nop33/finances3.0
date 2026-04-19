import Dexie, { type EntityTable } from 'dexie'

export interface MerchantMapping {
  id?: number
  keyword: string // lowercase, matched with includes()
  category: string
  subcategory: string
}

export interface StoredTransaction {
  id: string
  date: Date
  merchant: string
  description: string
  amount: number
  currency: string
  source: string
  sourceCard?: string
  category: string
  subcategory: string
}

export const db = new Dexie('financeTracker') as Dexie & {
  merchantMappings: EntityTable<MerchantMapping, 'id'>
  transactions: EntityTable<StoredTransaction, 'id'>
}

db.version(1).stores({
  merchantMappings: '++id, keyword',
  transactions: 'id, date, category, subcategory'
})

const SEED_MAPPINGS: Omit<MerchantMapping, 'id'>[] = [
  // Food
  { keyword: 'migros', category: 'Food', subcategory: 'Groceries' },
  { keyword: 'coop', category: 'Food', subcategory: 'Groceries' },
  { keyword: 'lidl', category: 'Food', subcategory: 'Groceries' },
  { keyword: 'aldi', category: 'Food', subcategory: 'Groceries' },
  { keyword: 'denner', category: 'Food', subcategory: 'Groceries' },
  { keyword: 'spar', category: 'Food', subcategory: 'Groceries' },

  // Transport
  { keyword: 'sbb', category: 'Transport', subcategory: 'SBB' },
  { keyword: 'uber', category: 'Transport', subcategory: 'Uber/Taxi' },

  // Traveling
  { keyword: 'booking.com', category: 'Traveling', subcategory: 'Accommodation' },
  { keyword: 'cheaptickets', category: 'Traveling', subcategory: 'Flights' },
  { keyword: 'turkish airlines', category: 'Traveling', subcategory: 'Flights' },
  { keyword: 'mytrip', category: 'Traveling', subcategory: 'Flights' }
]

export const seedDatabase = async () => {
  const count = await db.merchantMappings.count()
  if (count === 0) {
    await db.merchantMappings.bulkAdd(SEED_MAPPINGS)
  }
}
