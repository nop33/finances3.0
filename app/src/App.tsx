import { type Component, createSignal, Show, onMount, For } from 'solid-js'
import { parseFile } from './lib/parsers/detect'
import { categorize, saveMapping, type CategorizedTransaction } from './lib/categorization/engine'
import { seedDatabase } from './lib/storage/db'
import { convertToCHF } from './lib/currency'
import FileDropZone, { type File } from './components/FileDropZone'
import TransactionList from './components/TransactionList'
import CategorySummary from './components/CategorySummary'

const App: Component = () => {
  const [transactions, setTransactions] = createSignal<Array<CategorizedTransaction>>([])
  const [loadedFiles, setLoadedFiles] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(false)

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
            <TransactionList
              transactions={transactions()}
              onCategoryChange={handleCategoryChange}
              onDelete={(id) => setTransactions((prev) => prev.filter((t) => t.id !== id))}
              onDeleteMonth={(monthKey) =>
                setTransactions((prev) =>
                  prev.filter((t) => `${t.date.getFullYear()}-${t.date.getMonth()}` !== monthKey)
                )
              }
              onSplit={(id, splitPeople) =>
                setTransactions((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, splitPeople } : t))
                )
              }
            />
          </div>
          <div>
            <h2 class="text-xl font-bold mb-4">Summary</h2>
            <CategorySummary transactions={transactions()} />
          </div>
        </div>
      </Show>

    </div>
  )
}

export default App
