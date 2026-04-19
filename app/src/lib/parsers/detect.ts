import type { Transaction } from './types'
import { parseCembra } from './cembra'
import { parseSwisscard } from './swisscard'

type Parser = (csvText: string) => Array<Transaction>

const PARSERS: Record<string, Parser> = {
  'Account number': parseCembra,
  'Transaction date': parseSwisscard
}

export const parseCSV = (csvText: string): Array<Transaction> => {
  const firstLine = csvText.slice(0, csvText.indexOf('\n')).trim()

  for (const [headerKey, parser] of Object.entries(PARSERS)) {
    if (firstLine.includes(headerKey)) return parser(csvText)
  }

  throw new Error(`Unknown CSV format. Header: ${firstLine}`)
}
