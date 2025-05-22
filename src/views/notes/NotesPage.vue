<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotesStore } from '../../stores/notes'
import { useSubjectsStore } from '../../stores/subjects'
import SearchBar from '../../components/common/SearchBar.vue'
import SubjectSelector from '../../components/common/SubjectSelector.vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const notesStore = useNotesStore()
const subjectsStore = useSubjectsStore()

const selectedSubject = ref(null)
const searchQuery = ref('')

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await notesStore.fetchNotes()
})

const filteredNotes = computed(() => {
  let filtered = notesStore.notes

  // Filter by subject if selected
  if (selectedSubject.value) {
    filtered = filtered.filter(note => note.subjectId === selectedSubject.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // Sort by most recent
  return [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

const formatDate = (dateString) => {
  return format(new Date(dateString), 'd MMM, yyyy', { locale: es })
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
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Apuntes de Clase</h1>
      
      <router-link 
        to="/notes/new" 
        class="btn btn-primary flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Apunte
      </router-link>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="md:col-span-2">
        <SearchBar placeholder="Buscar por título o contenido..." @search="handleSearch" />
      </div>
      <div>
        <SubjectSelector v-model="selectedSubject" />
      </div>
    </div>
    
    <div v-if="notesStore.loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando apuntes...</p>
    </div>
    
    <div v-else-if="filteredNotes.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No se encontraron apuntes</p>
      <button
        v-if="selectedSubject || searchQuery"
        @click="resetFilters"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
      >
        Borrar filtros
      </button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="note in filteredNotes"
        :key="note.id"
        :to="`/notes/${note.id}`"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="mb-2 flex items-center">
          <span 
            class="inline-block w-3 h-3 rounded-full mr-2"
            :style="{ backgroundColor: getSubjectById(note.subjectId).color }"
          ></span>
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {{ getSubjectById(note.subjectId).name }}
          </span>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ note.title }}</h3>
        
        <div class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 prose-sm prose-p:my-0">
          <div v-html="note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '')"></div>
        </div>
        
        <div v-if="note.tags && note.tags.length > 0" class="mb-3 flex flex-wrap gap-1">
          <span 
            v-for="(tag, index) in note.tags"
            :key="index"
            class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          >
            {{ tag }}
          </span>
        </div>
        
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Última actualización: {{ formatDate(note.updatedAt) }}
        </div>
      </router-link>
    </div>
  </div>
</template>