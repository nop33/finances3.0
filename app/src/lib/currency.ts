import type { Transaction } from './parsers/types'

interface Rates {
  [currency: string]: number
}

let cachedRates: Rates | null = null

const fetchRates = async (): Promise<Rates | null> => {
  if (cachedRates) return cachedRates

  try {
    const res = await fetch('/api/rates/latest?base=CHF')
    if (!res.ok) {
      console.warn(`Failed to fetch exchange rates: ${res.status}`)
      return null
    }
    const data = await res.json()
    cachedRates = data.rates
    return cachedRates
  } catch (err) {
    console.warn('Could not fetch exchange rates:', err)
    return null
  }
}

export const convertToCHF = async (transactions: Transaction[]): Promise<Transaction[]> => {
  const needsConversion = transactions.some((tx) => tx.currency !== 'CHF')
  if (!needsConversion) return transactions

  const rates = await fetchRates()
  if (!rates) return transactions

  return transactions.map((tx) => {
    if (tx.currency === 'CHF') return tx

    const rate = rates[tx.currency]
    if (!rate) {
      console.warn(`No exchange rate for ${tx.currency}, leaving unconverted`)
      return tx
    }

    return {
      ...tx,
      amount: Math.round((tx.amount / rate) * 100) / 100,
      originalAmount: tx.amount,
      originalCurrency: tx.currency,
      currency: 'CHF'
    }
  })
}
