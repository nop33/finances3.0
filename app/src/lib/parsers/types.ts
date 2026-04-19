export type TransactionSource = 'cembra' | 'swisscard' | 'neon' | 'revolut' | 'manual'

export type TransactionType = 'expense' | 'payment' | 'cashback'

export interface Transaction {
  id: string
  date: Date
  merchant: string
  description: string
  amount: number // positive = expense, negative = income/credit
  currency: string
  source: TransactionSource
  sourceCard?: string
  rawCategory?: string // from source data (e.g., Swisscard's "Merchant Category")
  type: TransactionType
}
