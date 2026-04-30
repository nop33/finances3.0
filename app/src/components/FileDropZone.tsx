import { type Component, createSignal, onMount, onCleanup } from 'solid-js'

export type File = {
  name: string
  content: string | ArrayBuffer
}

interface FileDropZoneProps {
  onFilesLoaded: (files: Array<File>) => void
}

const FileDropZone: Component<FileDropZoneProps> = (props) => {
  const [dragging, setDragging] = createSignal(false)
  let dragCounter = 0

  const handleFiles = async (e: DragEvent) => {
    e.preventDefault()
    dragCounter = 0
    setDragging(false)

    const files = Array.from(e.dataTransfer?.files ?? [])
    const supportedExts = ['.csv', '.html', '.xlsx']
    const supportedFiles = files.filter((f) => supportedExts.some((ext) => f.name.endsWith(ext)))

    const results = await Promise.all(
      supportedFiles.map(async (file) => ({
        name: file.name,
        content: file.name.endsWith('.xlsx') ? await file.arrayBuffer() : await file.text()
      }))
    )

    if (results.length > 0) props.onFilesLoaded(results)
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter++
    setDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter--
    if (dragCounter === 0) setDragging(false)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  onMount(() => {
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleFiles)
  })

  onCleanup(() => {
    document.removeEventListener('dragenter', handleDragEnter)
    document.removeEventListener('dragleave', handleDragLeave)
    document.removeEventListener('dragover', handleDragOver)
    document.removeEventListener('drop', handleFiles)
  })

  return (
    <>
      <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <p class="text-gray-500 dark:text-gray-400">Drop files here</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Cembra, Swisscard, Neon (CSV) / SwissPass, Splitwise (HTML) / Revolut (XLSX)</p>
      </div>

      {dragging() && (
        <div class="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
          <div class="border-2 border-dashed border-blue-500 rounded-2xl p-20 bg-white/80 dark:bg-gray-800/80">
            <p class="text-blue-600 dark:text-blue-400 text-xl font-medium">Drop files anywhere</p>
          </div>
        </div>
      )}
    </>
  )
}

export default FileDropZone
