import Papa from 'papaparse'
import type { Transaction } from './types'
import { generateId } from './utils'

interface SwisscardRow {
  'Transaction date': string
  Description: string
  Merchant: string
  'Card number': string
  Currency: string
  Amount: string
  'Debit/Credit': string
  Status: string
  'Merchant Category': string
  'Registered Category': string
}

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number)
  return new Date(year, month - 1, day)
}

export const parseSwisscard = (csvText: string): Transaction[] => {
  const { data, errors } = Papa.parse<SwisscardRow>(csvText, { header: true, skipEmptyLines: true })

  if (errors.length > 0) console.warn('Swisscard CSV parse warnings:', errors)

  return data.map((row) => {
    const merchant = row['Merchant'].trim()
    const description = row['Description'].trim()
    const amount = parseFloat(row['Amount'])

    return {
      id: generateId('sc', `${row['Transaction date']}-${merchant || description}-${row['Amount']}`),
      date: parseDate(row['Transaction date']),
      merchant: merchant || description,
      description,
      amount: row['Debit/Credit'] === 'Debit' ? amount : -Math.abs(amount),
      currency: row['Currency'],
      source: 'swisscard' as const,
      sourceCard: row['Card number'],
      rawCategory: row['Merchant Category'] || undefined,
      type: row['Debit/Credit'] === 'Debit' ? ('expense' as const) : ('payment' as const)
    }
  })
}
