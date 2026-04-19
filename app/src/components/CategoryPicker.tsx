import { type Component, For, createSignal, createMemo, onMount, onCleanup } from 'solid-js'
import { CATEGORIES } from '../lib/categorization/categories'

interface CategoryPickerProps {
  onSelect: (category: string, subcategory: string) => void
  onCancel: () => void
}

interface Option {
  category: string
  subcategory: string
  label: string
}

const ALL_OPTIONS: Array<Option> = CATEGORIES.flatMap((cat) =>
  cat.subcategories.map((sub) => ({
    category: cat.name,
    subcategory: sub.name,
    label: `${cat.name} → ${sub.name}`
  }))
)

const CategoryPicker: Component<CategoryPickerProps> = (props) => {
  const [query, setQuery] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  let inputRef!: HTMLInputElement

  const filtered = createMemo(() => {
    const q = query().toLowerCase()
    if (!q) return ALL_OPTIONS
    return ALL_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(q))
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered().length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered()[selectedIndex()]
      if (opt) props.onSelect(opt.category, opt.subcategory)
    } else if (e.key === 'Escape') {
      props.onCancel()
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef && !inputRef.parentElement?.contains(e.target as Node)) {
      props.onCancel()
    }
  }

  onMount(() => {
    inputRef.focus()
    document.addEventListener('mousedown', handleClickOutside)
  })

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })

  return (
    <div class="absolute right-0 top-0 w-48 z-10">
      <input
        ref={inputRef}
        type="text"
        class="w-full border rounded p-1 text-xs bg-white"
        placeholder="Search category..."
        value={query()}
        onInput={(e) => {
          setQuery(e.currentTarget.value)
          setSelectedIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <div class="absolute z-10 mt-1 w-64 max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
        <For each={filtered()}>
          {(opt, i) => (
            <button
              class="w-full text-left px-2 py-1 text-xs hover:bg-gray-100"
              classList={{ 'bg-blue-50': i() === selectedIndex() }}
              onClick={() => props.onSelect(opt.category, opt.subcategory)}
            >
              {opt.label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export default CategoryPicker
