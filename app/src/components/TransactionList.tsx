import { type Component, For, Show, createSignal, createMemo, onMount, onCleanup } from 'solid-js'
import { type CategorizedTransaction } from '../lib/categorization/engine'
import CategoryPicker from './CategoryPicker'
import ScissorsIcon from './icons/ScissorsIcon'
import XMarkIcon from './icons/XMarkIcon'
import EllipsisVerticalIcon from './icons/EllipsisVerticalIcon'

interface TransactionListProps {
  transactions: Array<CategorizedTransaction>
  locale: string
  onCategoryChange: (transactionId: string, category: string, subcategory: string) => void
  onDelete: (transactionId: string) => void
  onSplit: (transactionId: string, splitPeople: number | undefined) => void
}

const TransactionList: Component<TransactionListProps> = (props) => {
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [splittingId, setSplittingId] = createSignal<string | null>(null)
  const [menuId, setMenuId] = createSignal<string | null>(null)

  const handleClickOutsideMenu = (e: MouseEvent) => {
    if (menuId() && !(e.target as HTMLElement).closest('.actions-menu')) {
      setMenuId(null)
    }
  }

  onMount(() => document.addEventListener('mousedown', handleClickOutsideMenu))
  onCleanup(() => document.removeEventListener('mousedown', handleClickOutsideMenu))

  const sorted = createMemo(() =>
    [...props.transactions].sort((a, b) => b.date.getTime() - a.date.getTime())
  )

  return (
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-500 border-b">
          <th class="pb-2 font-medium">Date</th>
          <th class="pb-2 font-medium">Merchant</th>
          <th class="pb-2 font-medium">Type</th>
          <th class="pb-2 font-medium text-right">Amount</th>
          <th class="pb-2 font-medium pl-4 w-48">Category</th>
          <th class="pb-2 w-8"></th>
        </tr>
      </thead>
      <tbody>
        <For each={sorted()}>
          {(tx) => (
            <tr
              class="group border-b border-gray-100"
              classList={{
                'bg-green-50': tx.confidence === 100,
                'bg-yellow-50': tx.confidence === 0,
              }}
            >
              <td class="py-2 pr-3 text-gray-500 whitespace-nowrap">
                {tx.date.toLocaleDateString(props.locale || undefined)}
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
                      <Show when={tx.splitPeople}>
                        <span class="text-xs text-orange-500 ml-1 flex items-center gap-0.5">
                          <ScissorsIcon class="w-4 h-4" />
                          ÷{tx.splitPeople}
                        </span>
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
              <td class="py-2 pl-2 relative">
                <div class="actions-menu">
                  <Show
                    when={splittingId() === tx.id}
                    fallback={
                      <button
                        class="text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setMenuId((prev) => prev === tx.id ? null : tx.id)}
                      >
                        <EllipsisVerticalIcon />
                      </button>
                    }
                  >
                    <div class="flex items-center gap-1">
                      <ScissorsIcon class="w-4 h-4 text-orange-500" />
                      <span class="text-xs text-gray-500">÷</span>
                      <input
                        type="number"
                        min="1"
                        value={tx.splitPeople ?? 2}
                        class="w-10 border rounded px-1 py-0.5 text-xs"
                        ref={(el) => setTimeout(() => el.focus())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(e.currentTarget.value)
                            if (val >= 1) props.onSplit(tx.id, val <= 1 ? undefined : val)
                            setSplittingId(null)
                          } else if (e.key === 'Escape') {
                            setSplittingId(null)
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.currentTarget.value)
                          if (val >= 1) props.onSplit(tx.id, val <= 1 ? undefined : val)
                          setSplittingId(null)
                        }}
                      />
                    </div>
                  </Show>
                  <Show when={menuId() === tx.id}>
                    <div class="absolute right-0 top-8 z-20 bg-white border rounded shadow-lg py-1 w-40">
                      <Show when={tx.category && tx.type === 'expense'}>
                        <button
                          class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setMenuId(null)
                            setSplittingId(tx.id)
                          }}
                        >
                          <ScissorsIcon class="w-4 h-4 text-gray-500" />
                          {tx.splitPeople ? 'Edit split' : 'Split expense'}
                        </button>
                      </Show>
                      <button
                        class="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-500 flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          if (confirm('Remove this transaction?')) {
                            setMenuId(null)
                            props.onDelete(tx.id)
                          }
                        }}
                      >
                        <XMarkIcon class="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </Show>
                </div>
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  )
}

export default TransactionList
