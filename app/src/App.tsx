import { type Component, createSignal, createMemo, createEffect, Show, onMount, For } from 'solid-js'
import { parseFile } from './lib/parsers/detect'
import { categorize, saveMapping, type CategorizedTransaction } from './lib/categorization/engine'
import { db, seedDatabase } from './lib/storage/db'
import { convertToCHF } from './lib/currency'
import FileDropZone, { type File } from './components/FileDropZone'
import TransactionList from './components/TransactionList'
import CategorySummary from './components/CategorySummary'
import ImportChecklist, { type ImportItem } from './components/ImportChecklist'
import Settings from './components/Settings'
import type { TransactionSource } from './lib/parsers/types'


interface ExpectedImport {
  id: string
  label: string
  source: TransactionSource
}

const EXPECTED_IMPORTS: ExpectedImport[] = [
  { id: 'cembra-1', label: 'Cembra Card 1', source: 'cembra' },
  { id: 'cembra-2', label: 'Cembra Card 2', source: 'cembra' },
  { id: 'swisscard', label: 'Swisscards', source: 'swisscard' },
  { id: 'neon', label: 'Neon', source: 'neon' },
  { id: 'revolut', label: 'Revolut', source: 'revolut' },
  { id: 'swisspass', label: 'SwissPass', source: 'swisspass' },
  { id: 'splitwise', label: 'Splitwise', source: 'splitwise' },
]

interface MonthGroup {
  key: string
  label: string
  transactions: Array<CategorizedTransaction>
}

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}`

const currentMonthKey = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}`
}

const App: Component = () => {
  const [transactions, setTransactions] = createSignal<Array<CategorizedTransaction>>([])
  const [loading, setLoading] = createSignal(false)
  const [dark, setDark] = createSignal(localStorage.getItem('dark') === 'true')
  const [locale, setLocale] = createSignal(localStorage.getItem('locale') || navigator.language)

  createEffect(() => {
    document.documentElement.classList.toggle('dark', dark())
    localStorage.setItem('dark', String(dark()))
  })
  const [selectedMonth, setSelectedMonth] = createSignal(currentMonthKey())
  const [manualToggles, setManualToggles] = createSignal<Record<string, boolean>>({})

  const selectedMonthLabel = () => {
    const [year, month] = selectedMonth().split('-').map(Number)
    const date = new Date(year, month)
    return date.toLocaleDateString(locale() || undefined, { month: 'long', year: 'numeric' })
  }

  const prevMonth = () => {
    const [year, month] = selectedMonth().split('-').map(Number)
    const d = new Date(year, month - 1)
    setSelectedMonth(`${d.getFullYear()}-${d.getMonth()}`)
    setManualToggles({})
  }

  const nextMonth = () => {
    const [year, month] = selectedMonth().split('-').map(Number)
    const d = new Date(year, month + 1)
    setSelectedMonth(`${d.getFullYear()}-${d.getMonth()}`)
    setManualToggles({})
  }

  const importItems = createMemo((): ImportItem[] => {
    const key = selectedMonth()
    const monthTxs = transactions().filter((t) => monthKey(t.date) === key)
    const toggles = manualToggles()

    const sourceCards: Record<string, Set<string>> = {}
    for (const tx of monthTxs) {
      if (!sourceCards[tx.source]) sourceCards[tx.source] = new Set()
      sourceCards[tx.source].add(tx.sourceCard ?? '')
    }

    const usedCards: Record<string, number> = {}

    return EXPECTED_IMPORTS.map((ei) => {
      if (toggles[ei.id] !== undefined) {
        return { id: ei.id, label: ei.label, done: toggles[ei.id] }
      }

      const cards = sourceCards[ei.source]
      if (!cards || cards.size === 0) return { id: ei.id, label: ei.label, done: false }

      usedCards[ei.source] = (usedCards[ei.source] ?? 0) + 1
      const done = usedCards[ei.source] <= cards.size

      return { id: ei.id, label: ei.label, done }
    })
  })

  const handleLocaleChange = (value: string) => {
    setLocale(value)
    localStorage.setItem('locale', value)
  }

  const monthLabel = (date: Date): string =>
    date.toLocaleDateString(locale() || undefined, { month: 'long', year: 'numeric' })

  const monthGroups = createMemo(() => {
    const sorted = [...transactions()].sort((a, b) => b.date.getTime() - a.date.getTime())
    const groups: MonthGroup[] = []

    for (const tx of sorted) {
      const key = monthKey(tx.date)
      const last = groups[groups.length - 1]
      if (last && last.key === key) {
        last.transactions.push(tx)
      } else {
        groups.push({ key, label: monthLabel(tx.date), transactions: [tx] })
      }
    }

    return groups
  })

  onMount(async () => {
    await seedDatabase()
    const stored = await db.transactions.toArray()
    if (stored.length > 0) {
      setTransactions(stored.map((t) => ({ ...t, date: new Date(t.date) })))
    }
  })

  const handleFilesLoaded = async (files: Array<File>) => {
    setLoading(true)
    try {
      for (const file of files) {
        const parsed = parseFile(file.content)
        if (parsed.length === 0) continue

        const converted = await convertToCHF(parsed)
        const categorized = await categorize(converted)
        const existingIds = new Set(transactions().map((t) => t.id))
        const newTxs = categorized.filter((t) => !existingIds.has(t.id))
        if (newTxs.length > 0) {
          await db.transactions.bulkPut(newTxs)
          setTransactions((prev) => [...prev, ...newTxs])
        }
      }
    } catch (err) {
      console.error('Error processing files:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = async (transactionId: string, category: string, subcategory: string) => {
    const tx = transactions().find((t) => t.id === transactionId)
    if (!tx) return

    await saveMapping(tx.merchant, category, subcategory)
    await db.transactions.update(transactionId, { category, subcategory, confidence: 100 })

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, category, subcategory, confidence: 100 } : t))
    )
  }

  const handleDelete = async (id: string) => {
    await db.transactions.delete(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }


  const handleSplit = async (id: string, splitPeople: number | undefined) => {
    await db.transactions.update(id, { splitPeople: splitPeople ?? undefined })
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, splitPeople } : t))
    )
  }

  return (
    <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div class="max-w-7xl mx-auto p-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold">Finance Tracker</h1>
        <Settings locale={locale()} onLocaleChange={handleLocaleChange} dark={dark()} onDarkChange={setDark} />
      </div>

      <FileDropZone onFilesLoaded={handleFilesLoaded} />
      <ImportChecklist
        items={importItems()}
        monthLabel={selectedMonthLabel()}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToggle={(id) =>
          setManualToggles((prev) => {
            const current = prev[id]
            if (current !== undefined) {
              const { [id]: _, ...rest } = prev
              return rest
            }
            const item = importItems().find((i) => i.id === id)
            return { ...prev, [id]: !item?.done }
          })
        }
      />

      <Show when={loading()}>
        <p class="mt-4 text-gray-500">Processing...</p>
      </Show>

      <For each={monthGroups()}>
        {(group) => (
          <div class="mt-8">
            <h2 class="text-xl font-bold mb-4">{group.label}</h2>
            <div class="grid grid-cols-3 gap-8">
              <div class="col-span-2">
                <TransactionList
                  transactions={group.transactions}
                  locale={locale()}
                  onCategoryChange={handleCategoryChange}
                  onDelete={handleDelete}
                  onSplit={handleSplit}
                />
              </div>
              <div>
                <CategorySummary transactions={group.transactions} />
              </div>
            </div>
          </div>
        )}
      </For>

    </div>
    </div>
  )
}

export default App
