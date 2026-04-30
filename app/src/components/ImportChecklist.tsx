import { type Component, For } from 'solid-js'

export interface ImportItem {
  id: string
  label: string
  fileName?: string
}

interface ImportChecklistProps {
  items: ImportItem[]
}

const ImportChecklist: Component<ImportChecklistProps> = (props) => {
  const done = () => props.items.filter((i) => i.fileName).length
  const total = () => props.items.length

  return (
    <div class="mt-4">
      <p class="text-xs text-gray-400 mb-2">
        Imported {done()}/{total()}
      </p>
      <div class="flex flex-wrap gap-2">
        <For each={props.items}>
          {(item) => (
            <div
              class="text-xs px-2 py-1 rounded border"
              classList={{
                'border-green-200 bg-green-50 text-green-700': !!item.fileName,
                'border-gray-200 bg-gray-50 text-gray-400': !item.fileName,
              }}
            >
              <span classList={{ 'line-through': !!item.fileName }}>
                {item.label}
              </span>
              {item.fileName && (
                <span class="ml-1 text-green-500 font-mono">{item.fileName}</span>
              )}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export default ImportChecklist
