import Papa from 'papaparse'
import type { Transaction } from './types'
import { generateId } from './utils'

interface NeonRow {
  Date: string
  Amount: string
  'Original amount': string
  'Original currency': string
  'Exchange rate': string
  Description: string
  Subject: string
  Category: string
}

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const parseNeon = (csvText: string): Transaction[] => {
  const { data, errors } = Papa.parse<NeonRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
  })

  if (errors.length > 0) console.warn('Neon CSV parse warnings:', errors)

  return data.map((row) => {
    const amount = parseFloat(row['Amount'])
    const description = row['Subject']?.trim() || ''
    const merchant = row['Description'].trim()

    return {
      id: generateId('neo', `${row['Date']}-${merchant}-${row['Amount']}`),
      date: parseDate(row['Date']),
      merchant,
      description,
      amount: Math.abs(amount),
      currency: row['Original currency']?.trim() || 'CHF',
      source: 'neon' as const,
      rawCategory: row['Category']?.trim() || undefined,
      type: amount < 0 ? ('expense' as const) : ('payment' as const)
    }
  })
}
