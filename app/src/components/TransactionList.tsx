import { type Component, For, Show, createSignal, createMemo } from 'solid-js'
import { type CategorizedTransaction } from '../lib/categorization/engine'
import CategoryPicker from './CategoryPicker'

interface TransactionListProps {
  transactions: Array<CategorizedTransaction>
  onCategoryChange: (transactionId: string, category: string, subcategory: string) => void
}

const TransactionList: Component<TransactionListProps> = (props) => {
  const [editingId, setEditingId] = createSignal<string | null>(null)

  const sorted = createMemo(() =>
    [...props.transactions].sort((a, b) => b.date.getTime() - a.date.getTime())
  )

  return (
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-500 border-b">
          <th class="pb-2 font-medium">Date</th>
          <th class="pb-2 font-medium">Merchant</th>
          <th class="pb-2 font-medium text-right">Amount</th>
          <th class="pb-2 font-medium pl-4">Category</th>
        </tr>
      </thead>
      <tbody>
        <For each={sorted()}>
          {(tx) => (
            <tr
              class="border-b border-gray-100"
              classList={{
                'bg-green-50': tx.confidence === 100,
                'bg-yellow-50': tx.confidence === 0,
              }}
            >
              <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">
                {tx.date.toLocaleDateString('de-CH')}
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
              <td class="py-2 text-right font-mono whitespace-nowrap">
                {tx.amount.toFixed(2)} {tx.currency}
              </td>
              <td class="py-2 pl-4">
                <Show
                  when={tx.category && editingId() !== tx.id}
                  fallback={
                    <CategoryPicker
                      onSelect={(cat, sub) => {
                        props.onCategoryChange(tx.id, cat, sub)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  }
                >
                  <button
                    class="text-xs text-gray-700 hover:text-gray-900"
                    onClick={() => setEditingId(tx.id)}
                  >
                    {tx.category} → {tx.subcategory}
                  </button>
                </Show>
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  )
}

export default TransactionList
