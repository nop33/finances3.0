import type { Transaction } from './types'
import { parseCembra } from './cembra'
import { parseSwisscard } from './swisscard'
import { parseSwisspass } from './swisspass'
import { parseNeon } from './neon'

type Parser = (text: string) => Array<Transaction>

const CSV_PARSERS: Record<string, Parser> = {
  'Account number': parseCembra,
  'Transaction date': parseSwisscard,
  '"Date";"Amount"': parseNeon
}

const isSwisspassHtml = (text: string): boolean => {
  const start = text.slice(0, 500)
  return start.includes('<!DOCTYPE html') && text.includes('swisspass.ch')
}

export const parseFile = (text: string): Array<Transaction> => {
  if (isSwisspassHtml(text)) return parseSwisspass(text)

  const firstLine = text.slice(0, text.indexOf('\n')).trim()

  for (const [headerKey, parser] of Object.entries(CSV_PARSERS)) {
    if (firstLine.includes(headerKey)) return parser(text)
  }

  throw new Error(`Unknown file format. Header: ${firstLine}`)
}

/** @deprecated Use parseFile instead */
export const parseCSV = parseFile
