import { type Component, For, Show, createSignal, createMemo } from 'solid-js'
import { type CategorizedTransaction } from '../lib/categorization/engine'
import CategoryPicker from './CategoryPicker'

interface MonthGroup {
  key: string
  label: string
  transactions: Array<CategorizedTransaction>
}

interface TransactionListProps {
  transactions: Array<CategorizedTransaction>
  onCategoryChange: (transactionId: string, category: string, subcategory: string) => void
  onDelete: (transactionId: string) => void
  onDeleteMonth: (monthKey: string) => void
  onSplit: (transactionId: string, splitPeople: number | undefined) => void
}

const monthLabel = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}`

const TransactionList: Component<TransactionListProps> = (props) => {
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [splittingId, setSplittingId] = createSignal<string | null>(null)

  const grouped = createMemo(() => {
    const sorted = [...props.transactions].sort((a, b) => b.date.getTime() - a.date.getTime())
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

  return (
    <For each={grouped()}>
      {(group) => (
        <div class="mb-8">
          <div class="group/month flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-700">{group.label}</h3>
            <button
              class="opacity-0 group-hover/month:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity"
              onClick={() => props.onDeleteMonth(group.key)}
            >
              Remove month
            </button>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium">Date</th>
                <th class="pb-2 font-medium">Merchant</th>
                <th class="pb-2 font-medium">Type</th>
                <th class="pb-2 font-medium text-right">Amount</th>
                <th class="pb-2 font-medium pl-4 w-48">Category</th>
              </tr>
            </thead>
            <tbody>
              <For each={group.transactions}>
                {(tx) => (
                  <tr
                    class="group border-b border-gray-100"
                    classList={{
                      'bg-green-50': tx.confidence === 100,
                      'bg-yellow-50': tx.confidence === 0,
                    }}
                  >
                    <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity text-base leading-none"
                          onClick={() => props.onDelete(tx.id)}
                          title="Remove transaction"
                        >
                          &times;
                        </button>
                        {tx.date.toLocaleDateString('de-CH')}
                      </div>
                    </td>
                    <td class="py-2 pr-3">
                      <div class="font-medium">{tx.merchant}</div>
                      <Show when={tx.description !== tx.merchant}>
                        <div class="text-gray-400 text-xs truncate max-w-xs" title={tx.description}>
                          {tx.description}
                        </div>
                      </Show>
                      <div class="text-gray-400 text-xs">
                        {tx.source}{tx.sourceCard ? ` · ${tx.sourceCard}` : ''}
                        <Show when={tx.rawCategory}>
                          {' · '}<span class="text-blue-400">{tx.rawCategory}</span>
                        </Show>
                      </div>
                    </td>
                    <td class="py-2 pr-3">
                      <span
                        class="text-xs px-1.5 py-0.5 rounded"
                        classList={{
                          'bg-red-100 text-red-700': tx.type === 'expense',
                          'bg-green-100 text-green-700': tx.type === 'payment' || tx.type === 'cashback',
                        }}
                      >
                        {tx.type === 'expense' ? 'expense' : 'income'}
                      </span>
                    </td>
                    <td class="py-2 text-right font-mono whitespace-nowrap">
                      {tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td class="py-2 pl-4 relative">
                      <Show
                        when={editingId() === tx.id}
                        fallback={
                          <div class="flex items-center gap-1">
                            <button
                              class="text-xs"
                              classList={{
                                'text-gray-700 hover:text-gray-900': !!tx.category,
                                'text-gray-400 hover:text-gray-600 italic': !tx.category,
                              }}
                              onClick={() => setEditingId(tx.id)}
                            >
                              {tx.category ? `${tx.category} → ${tx.subcategory}` : 'Select category'}
                            </button>
                            <Show when={tx.category && tx.type === 'expense'}>
                              <Show
                                when={splittingId() === tx.id}
                                fallback={
                                  <button
                                    class="text-xs transition-all ml-1 cursor-pointer"
                                    classList={{
                                      'text-orange-500 hover:text-orange-600': !!tx.splitPeople,
                                      'opacity-0 group-hover:opacity-30 hover:!opacity-100': !tx.splitPeople,
                                    }}
                                    onClick={() => {
                                      if (tx.splitPeople) {
                                        props.onSplit(tx.id, undefined)
                                      } else {
                                        setSplittingId(tx.id)
                                      }
                                    }}
                                    title={tx.splitPeople ? `Split by ${tx.splitPeople} — click to remove` : 'Split expense'}
                                  >
                                    {tx.splitPeople ? `✂ ÷${tx.splitPeople}` : '✂'}
                                  </button>
                                }
                              >
                                <div class="flex items-center gap-1 ml-1">
                                  <span class="text-xs text-gray-500">÷</span>
                                  <input
                                    type="number"
                                    min="2"
                                    value="2"
                                    class="w-10 border rounded px-1 py-0.5 text-xs"
                                    ref={(el) => setTimeout(() => el.focus())}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseInt(e.currentTarget.value)
                                        if (val >= 2) props.onSplit(tx.id, val)
                                        setSplittingId(null)
                                      } else if (e.key === 'Escape') {
                                        setSplittingId(null)
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.currentTarget.value)
                                      if (val >= 2) props.onSplit(tx.id, val)
                                      setSplittingId(null)
                                    }}
                                  />
                                </div>
                              </Show>
                            </Show>
                          </div>
                        }
                      >
                        <CategoryPicker
                          onSelect={(cat, sub) => {
                            props.onCategoryChange(tx.id, cat, sub)
                            setEditingId(null)
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      </Show>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      )}
    </For>
  )
}

export default TransactionList
