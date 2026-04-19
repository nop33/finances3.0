import { db, type MerchantMapping } from '../storage/db'
import type { Transaction } from '../parsers/types'

export interface CategorizedTransaction extends Transaction {
  category: string | null
  subcategory: string | null
  confidence: number // 0-100
}

const findMapping = (merchant: string, mappings: MerchantMapping[]): MerchantMapping | null =>
  mappings.find((m) => merchant.toLowerCase().includes(m.keyword)) ?? null

export const categorize = async (transactions: Array<Transaction>): Promise<Array<CategorizedTransaction>> => {
  const mappings = await db.merchantMappings.toArray()

  return transactions.map((tx) => {
    const mapping = findMapping(tx.merchant, mappings)

    if (mapping) {
      return { ...tx, category: mapping.category, subcategory: mapping.subcategory, confidence: 100 }
    }

    return { ...tx, category: null, subcategory: null, confidence: 0 }
  })
}

export const saveMapping = async (keyword: string, category: string, subcategory: string) => {
  const lower = keyword.toLowerCase()
  const existing = await db.merchantMappings.where('keyword').equals(lower).first()

  if (existing) {
    await db.merchantMappings.update(existing.id!, { category, subcategory })
  } else {
    await db.merchantMappings.add({ keyword: lower, category, subcategory })
  }
}
