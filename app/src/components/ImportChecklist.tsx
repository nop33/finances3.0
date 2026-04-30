import { type Component, For, type JSX } from 'solid-js'

export interface ImportItem {
  id: string
  label: string
  done: boolean
}

interface ImportChecklistProps {
  items: ImportItem[]
  monthLabel: string
  onToggle: (id: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const ImportChecklist: Component<ImportChecklistProps> = (props) => {
  const done = () => props.items.filter((i) => i.done).length
  const total = () => props.items.length

  return (
    <div class="mt-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="flex items-center gap-1">
          <button
            class="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
            onClick={props.onPrevMonth}
          >
            ‹
          </button>
          <span class="text-sm font-medium text-gray-600 min-w-32 text-center">
            {props.monthLabel}
          </span>
          <button
            class="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
            onClick={props.onNextMonth}
          >
            ›
          </button>
        </div>
        <span class="text-xs text-gray-400">
          {done()}/{total()}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <For each={props.items}>
          {(item) => (
            <button
              class="text-xs px-2 py-1 rounded border cursor-pointer transition-colors"
              classList={{
                'border-green-200 bg-green-50 text-green-700 hover:bg-green-100': item.done,
                'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100': !item.done,
              }}
              onClick={() => props.onToggle(item.id)}
            >
              <span classList={{ 'line-through': item.done }}>
                {item.label}
              </span>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export default ImportChecklist
