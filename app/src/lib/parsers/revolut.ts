import Papa from 'papaparse'
import type { Transaction } from './types'
import { generateId } from './utils'

interface RevolutRow {
  Type: string
  Product: string
  'Started Date': string
  'Completed Date': string
  Description: string
  Amount: string
  Fee: string
  Currency: string
  State: string
  Balance: string
}

const parseDate = (dateStr: string): Date => {
  const [datePart] = dateStr.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const parseRevolut = (csvText: string): Transaction[] => {
  const { data, errors } = Papa.parse<RevolutRow>(csvText, { header: true, skipEmptyLines: true })

  if (errors.length > 0) console.warn('Revolut CSV parse warnings:', errors)

  return data
    .filter((row) => row['State'] === 'COMPLETED')
    .map((row) => {
      const amount = parseFloat(row['Amount'])
      const merchant = row['Description'].trim()

      return {
        id: generateId('rev', `${row['Completed Date']}-${merchant}-${row['Amount']}`),
        date: parseDate(row['Completed Date']),
        merchant,
        description: row['Type'],
        amount: Math.abs(amount),
        currency: row['Currency'],
        source: 'revolut' as const,
        type: amount < 0 ? ('expense' as const) : ('payment' as const)
      }
    })
}
