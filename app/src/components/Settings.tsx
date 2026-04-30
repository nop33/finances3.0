import { type Component, For, Show, createSignal, createMemo, onMount, onCleanup } from 'solid-js'
import CogIcon from './icons/CogIcon'

interface SettingsProps {
  locale: string
  onLocaleChange: (locale: string) => void
}

interface LocaleOption {
  code: string
  label: string
}

const LOCALES: LocaleOption[] = Intl.DateTimeFormat.supportedLocalesOf(
  [
    'ar-SA', 'bn-BD', 'cs-CZ', 'da-DK', 'de-AT', 'de-CH', 'de-DE',
    'el-GR', 'en-AU', 'en-CA', 'en-GB', 'en-IN', 'en-US', 'es-AR',
    'es-ES', 'es-MX', 'fi-FI', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR',
    'he-IL', 'hi-IN', 'hu-HU', 'id-ID', 'it-CH', 'it-IT', 'ja-JP',
    'ko-KR', 'ms-MY', 'nb-NO', 'nl-BE', 'nl-NL', 'pl-PL', 'pt-BR',
    'pt-PT', 'ro-RO', 'ru-RU', 'sk-SK', 'sv-SE', 'th-TH', 'tr-TR',
    'uk-UA', 'vi-VN', 'zh-CN', 'zh-HK', 'zh-TW'
  ]
).map((code) => {
  const language = new Intl.DisplayNames([code], { type: 'language' }).of(code.split('-')[0]) ?? code
  const region = new Intl.DisplayNames([code], { type: 'region' }).of(code.split('-')[1]) ?? ''
  return { code, label: `${language} (${region})` }
}).sort((a, b) => a.label.localeCompare(b.label))

const Settings: Component<SettingsProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [picking, setPicking] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  let containerRef!: HTMLDivElement

  const filtered = createMemo(() => {
    const q = query().toLowerCase()
    if (!q) return LOCALES
    return LOCALES.filter((l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
  })

  const currentLabel = () =>
    LOCALES.find((l) => l.code === props.locale)?.label ?? props.locale

  const handleSelect = (code: string) => {
    props.onLocaleChange(code)
    setPicking(false)
    setQuery('')
  }

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
      if (opt) handleSelect(opt.code)
    } else if (e.key === 'Escape') {
      setPicking(false)
      setQuery('')
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setOpen(false)
      setPicking(false)
      setQuery('')
    }
  }

  onMount(() => document.addEventListener('mousedown', handleClickOutside))
  onCleanup(() => document.removeEventListener('mousedown', handleClickOutside))

  return (
    <div ref={containerRef} class="relative">
      <button
        class="text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        title="Settings"
      >
        <CogIcon />
      </button>

      <Show when={open()}>
        <div class="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-4 z-20">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Settings</h3>
          <label class="block text-xs text-gray-500 mb-1">Locale</label>
          <Show
            when={picking()}
            fallback={
              <button
                class="w-full text-left border rounded px-2 py-1 text-sm hover:bg-gray-50"
                onClick={() => setPicking(true)}
              >
                {currentLabel()}
              </button>
            }
          >
            <div class="relative">
              <input
                type="text"
                class="w-full border rounded px-2 py-1 text-sm"
                placeholder="Search locale..."
                value={query()}
                onInput={(e) => {
                  setQuery(e.currentTarget.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                ref={(el) => setTimeout(() => el.focus())}
              />
              <div class="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
                <For each={filtered()}>
                  {(opt, i) => (
                    <button
                      class="w-full text-left px-2 py-1 text-xs hover:bg-gray-100"
                      classList={{ 'bg-blue-50': i() === selectedIndex() }}
                      onClick={() => handleSelect(opt.code)}
                    >
                      <span class="font-medium">{opt.label}</span>
                      <span class="text-gray-400 ml-1">{opt.code}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <p class="text-xs text-gray-400 mt-2">
            Preview: {new Date().toLocaleDateString(props.locale || undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </Show>
    </div>
  )
}

export default Settings
