import { type Component, createSignal, createMemo, Show, onMount, For } from 'solid-js'
import { parseFile } from './lib/parsers/detect'
import { categorize, saveMapping, type CategorizedTransaction } from './lib/categorization/engine'
import { seedDatabase } from './lib/storage/db'
import { convertToCHF } from './lib/currency'
import FileDropZone, { type File } from './components/FileDropZone'
import TransactionList from './components/TransactionList'
import CategorySummary from './components/CategorySummary'
import Settings from './components/Settings'

interface MonthGroup {
  key: string
  label: string
  transactions: Array<CategorizedTransaction>
}

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}`

const App: Component = () => {
  const [transactions, setTransactions] = createSignal<Array<CategorizedTransaction>>([])
  const [loadedFiles, setLoadedFiles] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(false)
  const [locale, setLocale] = createSignal(localStorage.getItem('locale') || navigator.language)

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

  onMount(seedDatabase)

  const handleFilesLoaded = async (files: Array<File>) => {
    setLoading(true)
    try {
      setLoadedFiles((prev) => {
        const newNames = files.map((f) => f.name).filter((name) => !prev.includes(name))
        return [...prev, ...newNames]
      })
      const parsed = files.flatMap((f) => parseFile(f.content))
      const allTransactions = await convertToCHF(parsed)
      const categorized = await categorize(allTransactions)
      setTransactions((prev) => {
        const existingIds = new Set(prev.map((t) => t.id))
        const newTxs = categorized.filter((t) => !existingIds.has(t.id))
        return [...prev, ...newTxs]
      })
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

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, category, subcategory, confidence: 100 } : t))
    )
  }

  return (
    <div class="max-w-7xl mx-auto p-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold">Finance Tracker</h1>
        <Settings locale={locale()} onLocaleChange={handleLocaleChange} />
      </div>

      <FileDropZone onFilesLoaded={handleFilesLoaded} />

      <Show when={loadedFiles().length > 0}>
        <div class="mt-3 flex gap-2 flex-wrap">
          <For each={loadedFiles()}>
            {(name) => (
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {name}
              </span>
            )}
          </For>
        </div>
      </Show>

      <Show when={loading()}>
        <p class="mt-4 text-gray-500">Processing...</p>
      </Show>

      <For each={monthGroups()}>
        {(group) => (
          <div class="mt-8">
            <div class="group/month flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold">{group.label}</h2>
              <button
                class="opacity-0 group-hover/month:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity"
                onClick={() =>
                  setTransactions((prev) =>
                    prev.filter((t) => monthKey(t.date) !== group.key)
                  )
                }
              >
                Remove month
              </button>
            </div>
            <div class="grid grid-cols-3 gap-8">
              <div class="col-span-2">
                <TransactionList
                  transactions={group.transactions}
                  locale={locale()}
                  onCategoryChange={handleCategoryChange}
                  onDelete={(id) => setTransactions((prev) => prev.filter((t) => t.id !== id))}
                  onSplit={(id, splitPeople) =>
                    setTransactions((prev) =>
                      prev.map((t) => (t.id === id ? { ...t, splitPeople } : t))
                    )
                  }
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
  )
}

export default App
