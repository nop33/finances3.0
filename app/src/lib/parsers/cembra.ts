import Papa from 'papaparse'
import { type Transaction, type TransactionType } from './types'
import { generateId } from './utils'

interface CembraRow {
  'Account number': string
  'Credit Card': string
  'Booking date': string
  Merchant: string
  Description: string
  Type: string
  'Amount (CHF)': string
}

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const parseCembra = (csvText: string): Transaction[] => {
  const { data, errors } = Papa.parse<CembraRow>(csvText, { header: true, skipEmptyLines: true })

  if (errors.length > 0) console.warn('Cembra CSV parse warnings:', errors)

  return data.map((row) => {
    const description = row['Description'].trim()

    const getType = (): TransactionType => {
      if (row['Type'] === 'Debit') return 'expense'
      if (description.toLowerCase().includes('cashback')) return 'cashback'
      return 'payment'
    }

    return {
      id: generateId('cem', `${row['Booking date']}-${row['Merchant']}-${row['Amount (CHF)']}`),
      date: parseDate(row['Booking date']),
      merchant: row['Merchant'].trim(),
      description,
      amount: row['Type'] === 'Debit' ? parseFloat(row['Amount (CHF)']) : -parseFloat(row['Amount (CHF)']),
      currency: 'CHF',
      source: 'cembra' as const,
      sourceCard: row['Credit Card'],
      type: getType()
    }
  })
}
