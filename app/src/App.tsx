import { type Component, createSignal, Show, onMount, For } from 'solid-js'
import { parseCSV } from './lib/parsers/detect'
import { categorize, saveMapping, type CategorizedTransaction } from './lib/categorization/engine'
import { seedDatabase } from './lib/storage/db'
import type { Transaction } from './lib/parsers/types'
import FileDropZone, { type File } from './components/FileDropZone'
import TransactionList from './components/TransactionList'
import CategorySummary from './components/CategorySummary'

const App: Component = () => {
  const [transactions, setTransactions] = createSignal<Array<CategorizedTransaction>>([])
  const [nonExpenses, setNonExpenses] = createSignal<Array<Transaction>>([])
  const [showNonExpenses, setShowNonExpenses] = createSignal(false)
  const [loadedFiles, setLoadedFiles] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(false)

  onMount(seedDatabase)

  const handleFilesLoaded = async (files: Array<File>) => {
    setLoading(true)
    setLoadedFiles((prev) => {
      const newNames = files.map((f) => f.name).filter((name) => !prev.includes(name))
      return [...prev, ...newNames]
    })
    const allTransactions = files.flatMap((f) => parseCSV(f.content))
    const expenses = allTransactions.filter((tx) => tx.type === 'expense')
    setNonExpenses((prev) => [...prev, ...allTransactions.filter((tx) => tx.type !== 'expense')])
    const categorized = await categorize(expenses)
    setTransactions((prev) => {
      const existingIds = new Set(prev.map((t) => t.id))
      const newTxs = categorized.filter((t) => !existingIds.has(t.id))
      return [...prev, ...newTxs]
    })
    setLoading(false)
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
      <h1 class="text-2xl font-bold mb-8">Finance Tracker</h1>

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

      <Show when={transactions().length > 0}>
        <div class="mt-8 grid grid-cols-3 gap-8">
          <div class="col-span-2">
            <h2 class="text-xl font-bold mb-4">Transactions</h2>
            <TransactionList transactions={transactions()} onCategoryChange={handleCategoryChange} />
          </div>
          <div>
            <h2 class="text-xl font-bold mb-4">Summary</h2>
            <CategorySummary transactions={transactions()} />
          </div>
        </div>
      </Show>

      <Show when={nonExpenses().length > 0}>
        <div class="mt-8">
          <button
            class="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setShowNonExpenses((prev) => !prev)}
          >
            {showNonExpenses() ? '▼' : '▶'} Payments & Cashback ({nonExpenses().length})
          </button>

          <Show when={showNonExpenses()}>
            <table class="w-full text-sm mt-2 opacity-60">
              <tbody>
                <For each={nonExpenses()}>
                  {(tx) => (
                    <tr class="border-b border-gray-100">
                      <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">
                        {tx.date.toLocaleDateString('de-CH')}
                      </td>
                      <td class="py-2 pr-3">
                        <span class="font-medium">{tx.merchant}</span>
                        <span class="text-gray-400 text-xs ml-2">{tx.type}</span>
                      </td>
                      <td class="py-2 text-right font-mono whitespace-nowrap">
                        {tx.amount.toFixed(2)} {tx.currency}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default App
