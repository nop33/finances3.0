import { type Component, For, createMemo } from 'solid-js'
import { type CategorizedTransaction } from '../lib/categorization/engine'
import { CATEGORIES, type CategoryTier } from '../lib/categorization/categories'

interface CategorySummaryProps {
  transactions: Array<CategorizedTransaction>
}

interface CategoryTotal {
  category: string
  subcategory: string
  tier: CategoryTier
  total: number
}

const CategorySummary: Component<CategorySummaryProps> = (props) => {
  const totals = createMemo(() => {
    const map = new Map<string, CategoryTotal>()

    for (const tx of props.transactions) {
      if (!tx.category || !tx.subcategory || tx.amount <= 0) continue

      const key = `${tx.category}::${tx.subcategory}`
      const existing = map.get(key)
      const tier = getTier(tx.category, tx.subcategory)
      if (!tier) continue

      if (existing) {
        existing.total += tx.amount
      } else {
        map.set(key, {
          category: tx.category,
          subcategory: tx.subcategory,
          tier,
          total: tx.amount
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  })

  const tierTotal = (tier: CategoryTier) =>
    totals()
      .filter((t) => t.tier === tier)
      .reduce((sum, t) => sum + t.total, 0)

  const costOfLiving = () => tierTotal('need')
  const spentOnMe = () => costOfLiving() + tierTotal('want')
  const spentOnOthers = () => tierTotal('gifting')
  const lifestyle = () => spentOnMe() + spentOnOthers()
  const total = () => lifestyle() + tierTotal('savings')

  return (
    <div class="space-y-6">
      <div>
        <h3 class="font-bold text-lg mb-2">By Category</h3>
        <div class="space-y-1">
          <For each={totals()}>
            {(t) => (
              <div class="flex justify-between text-sm">
                <span>
                  {t.category} → {t.subcategory}
                  <span class="text-gray-400 ml-1">({t.tier})</span>
                </span>
                <span class="font-mono">{t.total.toFixed(2)}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      <div>
        <h3 class="font-bold text-lg mb-2">Summary</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Cost of Living</span>
            <span class="font-mono">{costOfLiving().toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Spent on Me</span>
            <span class="font-mono">{spentOnMe().toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Spent on Others</span>
            <span class="font-mono">{spentOnOthers().toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Lifestyle</span>
            <span class="font-mono">{lifestyle().toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold border-t pt-1">
            <span>Total</span>
            <span class="font-mono">{total().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategorySummary

const getTier = (category: string, subcategory: string): CategoryTier | null => {
  const cat = CATEGORIES.find((c) => c.name === category)
  if (!cat) return null
  const sub = cat.subcategories.find((s) => s.name === subcategory)
  return sub?.tier ?? null
}
