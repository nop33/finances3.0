import { type Component, For, Show, createSignal, createResource, onMount, onCleanup } from 'solid-js'
import { getAllCategories, addCustomCategory, CATEGORIES, type CategoryTier } from '../lib/categorization/categories'

interface CategoryPickerProps {
  onSelect: (category: string, subcategory: string) => void
  onCancel: () => void
}

interface Option {
  category: string
  subcategory: string
  label: string
}

const TIERS: CategoryTier[] = ['need', 'want', 'gifting', 'savings', 'transfer']

const CategoryPicker: Component<CategoryPickerProps> = (props) => {
  const [categories, { refetch }] = createResource(getAllCategories, { initialValue: CATEGORIES })
  const [query, setQuery] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [creating, setCreating] = createSignal(false)
  const [newCategory, setNewCategory] = createSignal('')
  const [newSubcategory, setNewSubcategory] = createSignal('')
  const [newTier, setNewTier] = createSignal<CategoryTier>('want')
  let inputRef!: HTMLInputElement
  let containerRef!: HTMLDivElement

  const options = () =>
    categories().flatMap((cat) =>
      cat.subcategories.map((sub) => ({
        category: cat.name,
        subcategory: sub.name,
        label: `${cat.name} → ${sub.name}`
      }))
    )

  const filtered = () => {
    const q = query().toLowerCase()
    if (!q) return options()
    return options().filter((opt) => opt.label.toLowerCase().includes(q))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (creating()) return
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
    if (containerRef && !containerRef.contains(e.target as Node)) {
      props.onCancel()
    }
  }

  const handleCreate = async () => {
    const cat = newCategory().trim()
    const sub = newSubcategory().trim()
    if (!cat || !sub) return

    await addCustomCategory(cat, sub, newTier())
    await refetch()
    setCreating(false)
    props.onSelect(cat, sub)
  }

  onMount(() => {
    inputRef.focus()
    document.addEventListener('mousedown', handleClickOutside)
  })

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })

  return (
    <div ref={containerRef} class="category-picker absolute right-0 top-0 w-48 z-10">
      <Show
        when={!creating()}
        fallback={
          <div class="w-64 bg-white border rounded shadow-lg p-2 space-y-2">
            <input
              type="text"
              class="w-full border rounded p-1 text-xs"
              placeholder="Category (e.g. Food)"
              value={newCategory()}
              onInput={(e) => setNewCategory(e.currentTarget.value)}
              list="existing-categories"
            />
            <datalist id="existing-categories">
              <For each={categories()}>
                {(cat) => <option value={cat.name} />}
              </For>
            </datalist>
            <input
              type="text"
              class="w-full border rounded p-1 text-xs"
              placeholder="Subcategory (e.g. Takeaway)"
              value={newSubcategory()}
              onInput={(e) => setNewSubcategory(e.currentTarget.value)}
            />
            <select
              class="w-full border rounded p-1 text-xs"
              value={newTier()}
              onChange={(e) => setNewTier(e.currentTarget.value as CategoryTier)}
            >
              <For each={TIERS}>
                {(tier) => <option value={tier}>{tier}</option>}
              </For>
            </select>
            <div class="flex gap-1">
              <button
                class="flex-1 text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600"
                onClick={handleCreate}
              >
                Add
              </button>
              <button
                class="flex-1 text-xs border rounded px-2 py-1 hover:bg-gray-50"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
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
          <button
            class="w-full text-left px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 border-t"
            onClick={() => setCreating(true)}
          >
            + New category...
          </button>
        </div>
      </Show>
    </div>
  )
}

export default CategoryPicker
