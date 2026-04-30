import type { Transaction } from './types'
import { parseCembra } from './cembra'
import { parseSwisscard } from './swisscard'
import { parseSwisspass } from './swisspass'
import { parseNeon } from './neon'
import { parseSplitwise } from './splitwise'

type Parser = (text: string) => Array<Transaction>

const CSV_PARSERS: Record<string, Parser> = {
  'Account number': parseCembra,
  'Transaction date': parseSwisscard,
  '"Date";"Amount"': parseNeon
}

const detectHtmlParser = (text: string): Parser | null => {
  const start = text.slice(0, 500)
  if (!start.includes('<!DOCTYPE html')) return null
  if (text.includes('swisspass.ch')) return parseSwisspass
  if (text.includes('splitwise.com')) return parseSplitwise
  return null
}

export const parseFile = (text: string): Array<Transaction> => {
  const htmlParser = detectHtmlParser(text)
  if (htmlParser) return htmlParser(text)

  const firstLine = text.slice(0, text.indexOf('\n')).trim()

  for (const [headerKey, parser] of Object.entries(CSV_PARSERS)) {
    if (firstLine.includes(headerKey)) return parser(text)
  }

  throw new Error(`Unknown file format. Header: ${firstLine}`)
}

/** @deprecated Use parseFile instead */
export const parseCSV = parseFile
