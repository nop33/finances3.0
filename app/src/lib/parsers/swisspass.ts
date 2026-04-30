import type { Transaction } from './types'
import { generateId } from './utils'

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number)
  return new Date(year, month - 1, day)
}

export const parseSwisspass = (html: string): Transaction[] => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const rows = doc.querySelectorAll('tr')

  const transactions: Transaction[] = []

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td')
    if (cells.length < 3) return

    const dateStr = cells[0].textContent?.trim() ?? ''
    const description = cells[1].textContent?.trim() ?? ''
    const amountStr = cells[2].textContent?.trim() ?? ''

    if (!dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) return

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) return

    transactions.push({
      id: generateId('sp', `${dateStr}-${description}-${amountStr}`),
      date: parseDate(dateStr),
      merchant: description,
      description,
      amount,
      currency: 'CHF',
      source: 'swisspass',
      type: 'expense'
    })
  })

  return transactions
}
