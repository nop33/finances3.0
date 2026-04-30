import Dexie, { type EntityTable } from 'dexie'
import { type CategoryTier } from '../categorization/categories'
import type { TransactionSource, TransactionType } from '../parsers/types'

export interface MerchantMapping {
  id?: number
  keyword: string // lowercase, matched with includes()
  category: string
  subcategory: string
}

export interface CustomCategory {
  id?: number
  category: string
  subcategory: string
  tier: CategoryTier
}

export interface StoredTransaction {
  id: string
  date: Date
  merchant: string
  description: string
  amount: number
  currency: string
  source: TransactionSource
  sourceCard?: string
  rawCategory?: string
  originalAmount?: number
  originalCurrency?: string
  type: TransactionType
  category: string | null
  subcategory: string | null
  confidence: number
  splitPeople?: number
}

export const db = new Dexie('financeTracker') as Dexie & {
  merchantMappings: EntityTable<MerchantMapping, 'id'>
  customCategories: EntityTable<CustomCategory, 'id'>
  transactions: EntityTable<StoredTransaction, 'id'>
}

db.version(1).stores({
  merchantMappings: '++id, keyword',
  transactions: 'id, date, category, subcategory'
})

db.version(2).stores({
  merchantMappings: '++id, keyword',
  customCategories: '++id, [category+subcategory]',
  transactions: 'id, date, category, subcategory'
})

db.version(3).stores({
  merchantMappings: '++id, keyword',
  customCategories: '++id, [category+subcategory]',
  transactions: 'id, date, source, category, subcategory'
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
