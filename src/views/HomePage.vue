<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { useNotesStore } from '../stores/notes'
import { useSubjectsStore } from '../stores/subjects'
import { usePlannerStore } from '../stores/planner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const tasksStore = useTasksStore()
const notesStore = useNotesStore()
const subjectsStore = useSubjectsStore()
const plannerStore = usePlannerStore()

const today = new Date()
const dayOfWeek = computed(() => {
  return format(today, 'EEEE', { locale: es })
})

const formattedDate = computed(() => {
  return format(today, "d 'de' MMMM, yyyy", { locale: es })
})

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await tasksStore.fetchUpcomingTasks()
  await notesStore.fetchNotes()
  
  const currentDay = format(today, 'EEEE', { locale: es }).toLowerCase()
  await plannerStore.fetchEventsByDay(currentDay)
  
  // Request notification permissions
  if ('Notification' in window && Notification.permission === 'default') {
    await tasksStore.requestNotificationPermission()
  }
})

const getSubjectById = (id) => {
  return subjectsStore.subjects.find(subject => subject.id === id) || { name: 'Sin materia', color: '#94a3b8' }
}

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
  }
  return colors[priority] || colors.medium
}

const formatTime = (time) => {
  return time ? time.substring(0, 5) : ''
}
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ dayOfWeek }}, {{ formattedDate }}</p>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">Bienvenido a EstudiaPlan</h1>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Upcoming Tasks -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tareas Próximas</h2>
          <router-link to="/tasks" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            Ver todas
          </router-link>
        </div>
        
        <div v-if="tasksStore.loading" class="py-4 text-center text-gray-500 dark:text-gray-400">
          Cargando tareas...
        </div>
        
        <div v-else-if="tasksStore.tasks.length === 0" class="py-4 text-center text-gray-500 dark:text-gray-400">
          No hay tareas próximas
        </div>
        
        <div v-else class="space-y-3">
          <router-link 
            v-for="task in tasksStore.tasks.slice(0, 5)" 
            :key="task.id" 
            :to="`/tasks/${task.id}`"
            class="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">{{ task.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Vence: {{ format(new Date(task.dueDate), 'd MMM', { locale: es }) }}
                </p>
              </div>
              
              <div class="flex items-center">
                <span 
                  class="inline-block px-2 py-1 text-xs rounded-full border"
                  :class="getPriorityColor(task.priority)"
                >
                  {{ task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : 'Alta' }}
                </span>
              </div>
            </div>
            
            <div class="mt-2 flex items-center">
              <span 
                class="inline-block w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: getSubjectById(task.subjectId).color }"
              ></span>
              <span class="text-xs text-gray-600 dark:text-gray-300">
                {{ getSubjectById(task.subjectId).name }}
              </span>
            </div>
          </router-link>
        </div>
      </div>
      
      <!-- Today's Schedule -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Horario de Hoy</h2>
          <router-link to="/planner" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            Ver calendario
          </router-link>
        </div>
        
        <div v-if="plannerStore.loading" class="py-4 text-center text-gray-500 dark:text-gray-400">
          Cargando horario...
        </div>
        
        <div v-else-if="plannerStore.events.length === 0" class="py-4 text-center text-gray-500 dark:text-gray-400">
          No hay eventos programados para hoy
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="event in plannerStore.events" 
            :key="event.id" 
            class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">{{ event.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                </p>
              </div>
            </div>
            
            <div class="mt-2 flex items-center">
              <span 
                class="inline-block w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: getSubjectById(event.subjectId).color }"
              ></span>
              <span class="text-xs text-gray-600 dark:text-gray-300">
                {{ getSubjectById(event.subjectId).name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Notes -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Apuntes Recientes</h2>
          <router-link to="/notes" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            Ver todos
          </router-link>
        </div>
        
        <div v-if="notesStore.loading" class="py-4 text-center text-gray-500 dark:text-gray-400">
          Cargando apuntes...
        </div>
        
        <div v-else-if="notesStore.notes.length === 0" class="py-4 text-center text-gray-500 dark:text-gray-400">
          No hay apuntes guardados
        </div>
        
        <div v-else class="space-y-3">
          <router-link 
            v-for="note in notesStore.notes.slice(0, 5)" 
            :key="note.id" 
            :to="`/notes/${note.id}`"
            class="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">{{ note.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ note.content.replace(/<[^>]*>?/gm, '') }}
                </p>
              </div>
            </div>
            
            <div class="mt-2 flex items-center">
              <span 
                class="inline-block w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: getSubjectById(note.subjectId).color }"
              ></span>
              <span class="text-xs text-gray-600 dark:text-gray-300">
                {{ getSubjectById(note.subjectId).name }}
              </span>
            </div>
          </router-link>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
        
        <div class="grid grid-cols-2 gap-3">
          <router-link 
            to="/notes/new" 
            class="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Nuevo Apunte</span>
          </router-link>
          
          <router-link 
            to="/tasks/new" 
            class="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Nueva Tarea</span>
          </router-link>
          
          <router-link 
            to="/grades" 
            class="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Registrar Nota</span>
          </router-link>
          
          <router-link 
            to="/pdfs" 
            class="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Subir PDF</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>