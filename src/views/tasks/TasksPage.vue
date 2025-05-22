<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTasksStore } from '../../stores/tasks'
import { useSubjectsStore } from '../../stores/subjects'
import SearchBar from '../../components/common/SearchBar.vue'
import SubjectSelector from '../../components/common/SubjectSelector.vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const tasksStore = useTasksStore()
const subjectsStore = useSubjectsStore()

const selectedSubject = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all') // all, pending, completed

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await tasksStore.fetchTasks()
  
  // Request notification permissions
  if ('Notification' in window && Notification.permission === 'default') {
    await tasksStore.requestNotificationPermission()
  }
})

const filteredTasks = computed(() => {
  let filtered = tasksStore.tasks

  // Filter by subject if selected
  if (selectedSubject.value) {
    filtered = filtered.filter(task => task.subjectId === selectedSubject.value)
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query))
    )
  }

  // Sort by due date (ascending)
  return [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
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
  statusFilter.value = 'all'
}

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
  }
  return colors[priority] || colors.medium
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
  }
  return colors[status] || colors.pending
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  }
  return labels[priority] || 'Media'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    'in-progress': 'En Progreso',
    completed: 'Completada'
  }
  return labels[status] || 'Pendiente'
}

const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const task = await tasksStore.getTaskById(taskId)
    if (task) {
      await tasksStore.updateTask(taskId, { ...task, status: newStatus })
    }
  } catch (err) {
    console.error('Error updating task status:', err)
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h1>
      
      <router-link 
        to="/tasks/new" 
        class="btn btn-primary flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Tarea
      </router-link>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="md:col-span-2">
        <SearchBar placeholder="Buscar tarea..." @search="handleSearch" />
      </div>
      <div>
        <SubjectSelector v-model="selectedSubject" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Estado
        </label>
        <select v-model="statusFilter" class="input">
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="in-progress">En Progreso</option>
          <option value="completed">Completadas</option>
        </select>
      </div>
    </div>
    
    <div v-if="tasksStore.loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando tareas...</p>
    </div>
    
    <div v-else-if="filteredTasks.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No se encontraron tareas</p>
      <button
        v-if="selectedSubject || searchQuery || statusFilter !== 'all'"
        @click="resetFilters"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
      >
        Borrar filtros
      </button>
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="card flex flex-col md:flex-row md:items-center gap-4"
      >
        <div class="flex-grow">
          <div class="flex items-center gap-2 mb-1">
            <span 
              class="inline-block w-3 h-3 rounded-full"
              :style="{ backgroundColor: getSubjectById(task.subjectId).color }"
            ></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">
              {{ getSubjectById(task.subjectId).name }}
            </span>
          </div>
          
          <router-link :to="`/tasks/${task.id}`" class="block">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ task.title }}</h3>
          </router-link>
          
          <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {{ task.description }}
          </p>
          
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Vence: {{ formatDate(task.dueDate) }}
            </span>
            
            <span 
              class="inline-block px-2 py-1 text-xs rounded-full border"
              :class="getPriorityColor(task.priority)"
            >
              {{ getPriorityLabel(task.priority) }}
            </span>
            
            <span 
              class="inline-block px-2 py-1 text-xs rounded-full border"
              :class="getStatusColor(task.status)"
            >
              {{ getStatusLabel(task.status) }}
            </span>
          </div>
        </div>
        
        <div class="flex flex-row md:flex-col gap-2">
          <router-link 
            :to="`/tasks/${task.id}`" 
            class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Editar
          </router-link>
          
          <button 
            v-if="task.status !== 'completed'"
            @click="updateTaskStatus(task.id, 'completed')" 
            class="px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
          >
            Completar
          </button>
          
          <button 
            v-else
            @click="updateTaskStatus(task.id, 'pending')" 
            class="px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-800/30 transition-colors"
          >
            Reabrir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>