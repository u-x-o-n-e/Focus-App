<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePdfsStore } from '../../stores/pdfs'
import { useSubjectsStore } from '../../stores/subjects'
import SearchBar from '../../components/common/SearchBar.vue'
import SubjectSelector from '../../components/common/SubjectSelector.vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const pdfsStore = usePdfsStore()
const subjectsStore = useSubjectsStore()

const selectedSubject = ref(null)
const searchQuery = ref('')
const showUploadForm = ref(false)
const uploadedFile = ref(null)
const fileInputRef = ref(null)
const newPdf = ref({
  title: '',
  subjectId: null
})

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await pdfsStore.fetchPdfs()
})

const filteredPdfs = computed(() => {
  let filtered = pdfsStore.pdfs

  // Filter by subject if selected
  if (selectedSubject.value) {
    filtered = filtered.filter(pdf => pdf.subjectId === selectedSubject.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(pdf => 
      pdf.title.toLowerCase().includes(query)
    )
  }

  // Sort by most recent
  return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const formatDate = (dateString) => {
  return format(new Date(dateString), 'd MMM, yyyy', { locale: es })
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const getSubjectById = (id) => {
  return subjectsStore.subjects.find(subject => subject.id === id) || { name: 'Sin materia', color: '#94a3b8' }
}

const handleSearch = (query) => {
  searchQuery.value = query
}

const resetFilters = () => {
  selectedSubject.value = null
  searchQuery.value = ''
}

const openUploadForm = () => {
  newPdf.value = {
    title: '',
    subjectId: null
  }
  uploadedFile.value = null
  showUploadForm.value = true
}

const closeUploadForm = () => {
  showUploadForm.value = false
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    uploadedFile.value = file
    // Auto-fill title with filename (without extension)
    if (!newPdf.value.title) {
      newPdf.value.title = file.name.replace('.pdf', '')
    }
  } else {
    alert('Por favor selecciona un archivo PDF válido')
    uploadedFile.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const uploadPdf = async () => {
  if (!uploadedFile.value) {
    alert('Por favor selecciona un archivo PDF')
    return
  }
  
  if (!newPdf.value.title.trim()) {
    alert('Por favor ingresa un título para el documento')
    return
  }
  
  if (!newPdf.value.subjectId) {
    alert('Por favor selecciona una materia')
    return
  }
  
  try {
    await pdfsStore.addPdf(newPdf.value, uploadedFile.value)
    closeUploadForm()
  } catch (err) {
    console.error('Error uploading PDF:', err)
    alert('Error al subir el PDF')
  }
}

const deletePdf = async (pdfId) => {
  if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
    try {
      await pdfsStore.deletePdf(pdfId)
    } catch (err) {
      console.error('Error deleting PDF:', err)
      alert('Error al eliminar el PDF')
    }
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documentos PDF</h1>
      
      <button
        @click="openUploadForm"
        class="btn btn-primary flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
        </svg>
        Subir PDF
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="md:col-span-2">
        <SearchBar placeholder="Buscar documentos..." @search="handleSearch" />
      </div>
      <div>
        <SubjectSelector v-model="selectedSubject" />
      </div>
    </div>
    
    <div v-if="pdfsStore.loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando documentos...</p>
    </div>
    
    <div v-else-if="filteredPdfs.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No se encontraron documentos</p>
      <button
        v-if="selectedSubject || searchQuery"
        @click="resetFilters"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
      >
        Borrar filtros
      </button>
      <button
        @click="openUploadForm"
        class="mt-4 btn btn-primary"
      >
        Subir tu primer PDF
      </button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="pdf in filteredPdfs"
        :key="pdf.id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="mb-2 flex items-center">
          <span 
            class="inline-block w-3 h-3 rounded-full mr-2"
            :style="{ backgroundColor: getSubjectById(pdf.subjectId).color }"
          ></span>
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {{ getSubjectById(pdf.subjectId).name }}
          </span>
        </div>
        
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-10 h-12 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div class="flex-grow">
            <router-link :to="`/pdfs/${pdf.id}`">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">{{ pdf.title }}</h3>
            </router-link>
            
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ formatFileSize(pdf.size) }}</span>
              <span>{{ formatDate(pdf.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="mt-4 flex justify-between">
          <router-link 
            :to="`/pdfs/${pdf.id}`" 
            class="px-3 py-1.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-lg text-sm hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-colors"
          >
            Abrir
          </router-link>
          
          <button 
            @click.stop="deletePdf(pdf.id)" 
            class="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Upload PDF Modal -->
    <div 
      v-if="showUploadForm" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Subir Nuevo PDF
        </h3>
        
        <div class="space-y-4">
          <div 
            class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center"
            :class="{ 'border-primary-500 dark:border-primary-500': uploadedFile }"
          >
            <div v-if="!uploadedFile">
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar
              </p>
              
              <input 
                type="file"
                ref="fileInputRef"
                @change="handleFileChange"
                accept="application/pdf"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
            </div>
            
            <div v-else class="text-left">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-12 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <div class="flex-grow">
                  <h4 class="text-base font-medium text-gray-900 dark:text-white">{{ uploadedFile.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatFileSize(uploadedFile.size) }}</p>
                </div>
                
                <button 
                  @click="uploadedFile = null; if (fileInputRef.value) fileInputRef.value.value = ''"
                  class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              v-model="newPdf.title" 
              placeholder="Título del documento" 
              class="input"
            >
          </div>
          
          <div>
            <SubjectSelector v-model="newPdf.subjectId" :required="true" />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeUploadForm" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="uploadPdf" 
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            :disabled="!uploadedFile"
          >
            Subir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>