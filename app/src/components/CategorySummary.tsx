import { type Component, For, createMemo, createResource } from 'solid-js'
import { type CategorizedTransaction } from '../lib/categorization/engine'
import { CATEGORIES, getAllCategories, type Category, type CategoryTier } from '../lib/categorization/categories'

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
  const [allCategories] = createResource(getAllCategories, { initialValue: CATEGORIES })

  const totals = createMemo(() => {
    const map = new Map<string, CategoryTotal>()

    const addToMap = (category: string, subcategory: string, amount: number) => {
      const key = `${category}::${subcategory}`
      const tier = getTier(category, subcategory, allCategories())
      if (!tier) return

      const existing = map.get(key)
      if (existing) {
        existing.total += amount
      } else {
        map.set(key, { category, subcategory, tier, total: amount })
      }
    }

    for (const tx of props.transactions) {
      if (!tx.category || !tx.subcategory) continue

      const amount = tx.type === 'expense' ? Math.abs(tx.amount) : -Math.abs(tx.amount)

      if (tx.splitPeople && tx.splitPeople >= 2) {
        const myShare = amount / tx.splitPeople
        const treatsShare = amount - myShare
        addToMap(tx.category, tx.subcategory, myShare)
        addToMap('Gifts/Donations', 'Treats', treatsShare)
      } else {
        addToMap(tx.category, tx.subcategory, amount)
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
          <For each={totals().filter((t) => t.tier !== 'transfer')}>
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

const getTier = (category: string, subcategory: string, categories: Category[]): CategoryTier | null => {
  const cat = categories.find((c) => c.name === category)
  if (!cat) return null
  const sub = cat.subcategories.find((s) => s.name === subcategory)
  return sub?.tier ?? null
}
