import type { Transaction } from './types'
import { generateId } from './utils'

const parseAmount = (text: string): { currency: string; amount: number } => {
  const cleaned = text.trim()
  const match = cleaned.match(/^([A-Z]{2,3}|Fr)\.?([\d.,]+)$/)
  if (!match) return { currency: 'CHF', amount: 0 }

  const currency = match[1] === 'Fr' ? 'CHF' : match[1]
  const amount = parseFloat(match[2].replace(',', ''))
  return { currency, amount }
}

export const parseSplitwise = (html: string): Transaction[] => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const entries = doc.querySelectorAll('.expense.summary[data-involved="true"]')

  const transactions: Transaction[] = []

  entries.forEach((entry) => {
    if (entry.classList.contains('payment')) return

    const dateAttr = entry.getAttribute('data-date')
    if (!dateAttr) return

    const date = new Date(dateAttr)

    const descriptionEl = entry.querySelector('.description a')
    const merchant = descriptionEl?.textContent?.trim().replace(/\s+/g, ' ') ?? ''

    const groupEl = entry.querySelector('.label.group')
    const group = groupEl?.textContent?.trim()

    const youDiv = entry.querySelector('.you')
    if (!youDiv) return

    const negativeEl = youDiv.querySelector('.negative')
    const positiveEl = youDiv.querySelector('.positive')

    if (negativeEl) {
      const { currency, amount } = parseAmount(negativeEl.textContent ?? '')
      if (amount === 0) return

      transactions.push({
        id: generateId('sw', `${dateAttr}-${merchant}-neg-${amount}`),
        date,
        merchant,
        description: group ? `Splitwise · ${group}` : 'Splitwise',
        amount,
        currency,
        source: 'splitwise',
        type: 'expense'
      })
    }

    if (positiveEl) {
      const { currency, amount } = parseAmount(positiveEl.textContent ?? '')
      if (amount === 0) return

      transactions.push({
        id: generateId('sw', `${dateAttr}-${merchant}-pos-${amount}`),
        date,
        merchant,
        description: group ? `Splitwise · ${group}` : 'Splitwise',
        amount: -amount,
        currency,
        source: 'splitwise',
        type: 'payment'
      })
    }
  })

  return transactions
}
