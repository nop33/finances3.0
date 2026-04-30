import * as XLSX from 'xlsx'
import type { Transaction } from './types'
import { parseCembra } from './cembra'
import { parseSwisscard } from './swisscard'
import { parseSwisspass } from './swisspass'
import { parseNeon } from './neon'
import { parseSplitwise } from './splitwise'
import { parseRevolut } from './revolut'

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

const parseXlsx = (buffer: ArrayBuffer): Array<Transaction> => {
  const wb = XLSX.read(buffer)
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
  const firstLine = csv.slice(0, csv.indexOf('\n')).trim()

  if (firstLine.includes('Started Date')) return parseRevolut(csv)

  throw new Error(`Unknown XLSX format. Header: ${firstLine}`)
}

export const parseFile = (content: string | ArrayBuffer): Array<Transaction> => {
  if (content instanceof ArrayBuffer) return parseXlsx(content)

  const htmlParser = detectHtmlParser(content)
  if (htmlParser) return htmlParser(content)

  const firstLine = content.slice(0, content.indexOf('\n')).trim()

  for (const [headerKey, parser] of Object.entries(CSV_PARSERS)) {
    if (firstLine.includes(headerKey)) return parser(content)
  }

  throw new Error(`Unknown file format. Header: ${firstLine}`)
}
