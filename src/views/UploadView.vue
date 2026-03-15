<script setup lang="ts">
import { ref } from 'vue'
import { useWatchHistoryStore } from '@/stores/watchHistory'

const store = useWatchHistoryStore()
const dragging = ref(false)

// Recursively search a FileSystemEntry tree for Wiedergabeverlauf.html
async function findWatchFile(entry: FileSystemEntry): Promise<File | null> {
  if (entry.isFile) {
    if (entry.name === 'Wiedergabeverlauf.html') {
      return new Promise((resolve, reject) => {
        ;(entry as FileSystemFileEntry).file(resolve, reject)
      })
    }
    return null
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })
    for (const child of entries) {
      const found = await findWatchFile(child)
      if (found) return found
    }
  }
  return null
}

async function processItems(items: DataTransferItemList) {
  for (const item of items) {
    const entry = item.webkitGetAsEntry()
    if (!entry) continue
    const found = await findWatchFile(entry)
    if (found) {
      store.loadFile(found)
      return
    }
  }
  store.error = 'Could not find Wiedergabeverlauf.html in the uploaded folder.'
}

async function onDrop(e: DragEvent) {
  dragging.value = false
  if (!e.dataTransfer) return

  // Check if items API is available (needed for folder traversal)
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    await processItems(e.dataTransfer.items)
  } else {
    const file = e.dataTransfer.files[0]
    if (file) store.loadFile(file)
  }
}

async function onFileInput(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return

  // Look for Wiedergabeverlauf.html among all selected files (folder input provides full list)
  const match = Array.from(files).find((f) => f.name === 'Wiedergabeverlauf.html')
  if (match) {
    store.loadFile(match)
  } else if (files.length === 1 && files[0]?.name.endsWith('.html')) {
    store.loadFile(files[0])
  } else {
    store.error = 'Could not find Wiedergabeverlauf.html in the selected folder.'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6">
    <div class="max-w-lg w-full text-center space-y-6">
      <div class="space-y-2">
        <div class="flex items-center justify-center gap-2">
          <UIcon name="i-simple-icons-youtube" class="text-red-500 text-4xl w-10 h-10" />
          <h1 class="text-3xl font-bold text-white">YouTube Report</h1>
        </div>
        <p class="text-gray-400 text-sm">
          Visualise your Google Takeout watch history — all processing happens locally in your browser.
        </p>
      </div>

      <div
        class="border-2 border-dashed rounded-2xl p-12 transition-colors cursor-pointer"
        :class="dragging ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-gray-500'"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
        @click="($refs.folderInput as HTMLInputElement).click()"
      >
        <div class="flex flex-col items-center gap-4 pointer-events-none">
          <UIcon
            name="i-lucide-folder-open"
            class="w-12 h-12"
            :class="dragging ? 'text-red-400' : 'text-gray-500'"
          />
          <div>
            <p class="text-white font-medium">Drop your YouTube Takeout folder here</p>
            <p class="text-gray-500 text-sm mt-1">or click to browse — selects the entire folder</p>
          </div>
          <div class="flex gap-2 flex-wrap justify-center">
            <UBadge variant="soft" color="neutral">YouTube Takeout folder</UBadge>
            <UBadge variant="soft" color="neutral">Wiedergabeverlauf.html</UBadge>
          </div>
        </div>
        <!-- Folder input: picks all files inside selected directory -->
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          multiple
          accept=".html"
          class="hidden"
          @change="onFileInput"
        />
      </div>

      <UAlert
        v-if="store.error"
        color="error"
        variant="soft"
        :description="store.error"
        icon="i-lucide-alert-circle"
      />

      <div v-if="store.loading" class="flex items-center justify-center gap-3 text-gray-400">
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin" />
        <span>Parsing watch history…</span>
      </div>

      <p class="text-xs text-gray-600">
        Find your export at
        <code class="text-gray-400">Google Takeout → YouTube und YouTube Music</code>
      </p>
    </div>
  </div>
</template>
