<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePdfsStore } from '../../stores/pdfs'
import { useSubjectsStore } from '../../stores/subjects'
import * as pdfjs from 'pdfjs-dist'
import { PDFWorker } from 'pdfjs-dist'

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const route = useRoute()
const router = useRouter()
const pdfsStore = usePdfsStore()
const subjectsStore = useSubjectsStore()

const pdfId = ref(Number(route.params.id))
const pdfDocument = ref(null)
const pdfData = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const loading = ref(true)
const canvasRef = ref(null)
const scale = ref(1.0)

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await loadPdf()
})

onBeforeUnmount(() => {
  if (pdfDocument.value) {
    pdfDocument.value.destroy()
  }
})

const loadPdf = async () => {
  loading.value = true
  
  try {
    // Get PDF data from the store
    pdfData.value = await pdfsStore.getPdfById(pdfId.value)
    
    if (!pdfData.value) {
      router.push('/pdfs')
      return
    }
    
    // Convert ArrayBuffer to Uint8Array
    const arrayBuffer = pdfData.value.file
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: uint8Array })
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages
    
    // Render the first page
    await renderPage(currentPage.value)
  } catch (err) {
    console.error('Error loading PDF:', err)
    alert('Error al cargar el PDF')
  } finally {
    loading.value = false
  }
}

const renderPage = async (pageNumber) => {
  try {
    const page = await pdfDocument.value.getPage(pageNumber)
    const viewport = page.getViewport({ scale: scale.value })
    
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
  } catch (err) {
    console.error('Error rendering PDF page:', err)
  }
}

const previousPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage(currentPage.value)
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await renderPage(currentPage.value)
  }
}

const zoomIn = async () => {
  scale.value += 0.2
  await renderPage(currentPage.value)
}

const zoomOut = async () => {
  if (scale.value > 0.5) {
    scale.value -= 0.2
    await renderPage(currentPage.value)
  }
}

const downloadPdf = () => {
  if (!pdfData.value) return
  
  // Create a Blob from the PDF ArrayBuffer
  const blob = new Blob([pdfData.value.file], { type: 'application/pdf' })
  
  // Create a download link
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${pdfData.value.title}.pdf`
  link.click()
  
  // Clean up
  URL.revokeObjectURL(link.href)
}

const getSubjectById = (id) => {
  return subjectsStore.subjects.find(subject => subject.id === id) || { name: 'Sin materia', color: '#94a3b8' }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <router-link to="/pdfs" class="mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        
        <h1 v-if="pdfData" class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ pdfData.title }}
        </h1>
      </div>
      
      <button
        v-if="pdfData"
        @click="downloadPdf"
        class="btn btn-primary flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar
      </button>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando documento...</p>
    </div>
    
    <div v-else-if="pdfData" class="card">
      <div v-if="pdfData.subjectId" class="mb-3 flex items-center">
        <span 
          class="inline-block w-3 h-3 rounded-full mr-2"
          :style="{ backgroundColor: getSubjectById(pdfData.subjectId).color }"
        ></span>
        <span class="text-sm text-gray-600 dark:text-gray-300">
          {{ getSubjectById(pdfData.subjectId).name }}
        </span>
      </div>
      
      <!-- PDF Controls -->
      <div class="flex items-center justify-between mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center space-x-2">
          <button
            @click="previousPage"
            class="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
            :disabled="currentPage === 1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          
          <button
            @click="nextPage"
            class="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
            :disabled="currentPage === totalPages"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="zoomOut"
            class="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ Math.round(scale * 100) }}%
          </span>
          
          <button
            @click="zoomIn"
            class="p-2 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- PDF Viewer -->
      <div class="overflow-auto bg-gray-200 dark:bg-gray-900 rounded-lg p-4 flex justify-center">
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
  </div>
</template>