<script setup>
import { ref, onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useSubjectsStore } from '../stores/subjects'
import { useNotesStore } from '../stores/notes'
import { useTasksStore } from '../stores/tasks'
import { usePlannerStore } from '../stores/planner'
import { useGradesStore } from '../stores/grades'
import { usePdfsStore } from '../stores/pdfs'

const themeStore = useThemeStore()
const subjectsStore = useSubjectsStore()
const notesStore = useNotesStore()
const tasksStore = useTasksStore()
const plannerStore = usePlannerStore()
const gradesStore = useGradesStore()
const pdfsStore = usePdfsStore()

const exportLoading = ref(false)
const importLoading = ref(false)
const deleteConfirmation = ref(false)
const fileInputRef = ref(null)

onMounted(async () => {
  await subjectsStore.fetchSubjects()
})

const exportData = async () => {
  exportLoading.value = true
  
  try {
    await notesStore.fetchNotes()
    await tasksStore.fetchTasks()
    await plannerStore.fetchEvents()
    await gradesStore.fetchGrades()
    await pdfsStore.fetchPdfs()
    
    const exportData = {
      subjects: subjectsStore.subjects,
      notes: notesStore.notes,
      tasks: tasksStore.tasks,
      planner: plannerStore.events,
      grades: gradesStore.grades,
      // Don't include PDF binary data, only metadata
      pdfs: pdfsStore.pdfs.map(pdf => ({
        id: pdf.id,
        title: pdf.title,
        subjectId: pdf.subjectId,
        size: pdf.size,
        createdAt: pdf.createdAt,
        updatedAt: pdf.updatedAt
      }))
    }
    
    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `estudiaplan_backup_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error exporting data:', err)
    alert('Error al exportar los datos')
  } finally {
    exportLoading.value = false
  }
}

const triggerImportDialog = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleImportFile = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  importLoading.value = true
  
  try {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        if (!data.subjects || !Array.isArray(data.subjects)) {
          throw new Error('Invalid data format')
        }
        
        // Confirm import
        if (!confirm('¿Estás seguro de que deseas importar estos datos? Los datos existentes serán reemplazados.')) {
          importLoading.value = false
          return
        }
        
        // Import subjects first
        for (const subject of data.subjects) {
          await subjectsStore.addSubject({
            name: subject.name,
            color: subject.color
          })
        }
        
        // Import notes
        if (data.notes && Array.isArray(data.notes)) {
          for (const note of data.notes) {
            await notesStore.addNote({
              title: note.title,
              content: note.content,
              subjectId: note.subjectId,
              tags: note.tags || []
            })
          }
        }
        
        // Import tasks
        if (data.tasks && Array.isArray(data.tasks)) {
          for (const task of data.tasks) {
            await tasksStore.addTask({
              title: task.title,
              description: task.description || '',
              dueDate: task.dueDate,
              subjectId: task.subjectId,
              priority: task.priority || 'medium',
              status: task.status || 'pending'
            })
          }
        }
        
        // Import planner events
        if (data.planner && Array.isArray(data.planner)) {
          for (const event of data.planner) {
            await plannerStore.addEvent({
              title: event.title,
              description: event.description || '',
              startTime: event.startTime,
              endTime: event.endTime,
              day: event.day,
              subjectId: event.subjectId
            })
          }
        }
        
        // Import grades
        if (data.grades && Array.isArray(data.grades)) {
          for (const grade of data.grades) {
            await gradesStore.addGrade({
              title: grade.title,
              score: grade.score,
              maxScore: grade.maxScore,
              weight: grade.weight,
              date: grade.date,
              subjectId: grade.subjectId
            })
          }
        }
        
        alert('Datos importados correctamente')
        location.reload()
      } catch (err) {
        console.error('Error parsing import file:', err)
        alert('Error al importar los datos: formato de archivo inválido')
      } finally {
        importLoading.value = false
      }
    }
    
    reader.readAsText(file)
  } catch (err) {
    console.error('Error importing data:', err)
    alert('Error al importar los datos')
    importLoading.value = false
  }
}

const showDeleteConfirmation = () => {
  deleteConfirmation.value = true
}

const cancelDelete = () => {
  deleteConfirmation.value = false
}

const deleteAllData = async () => {
  try {
    // Confirm deletion
    if (!confirm('¿Estás ABSOLUTAMENTE seguro? Esta acción eliminará TODOS tus datos y no puede deshacerse.')) {
      cancelDelete()
      return
    }
    
    // Delete all data from IndexedDB
    const db = await window.indexedDB.open('EstudiaPlan')
    db.onupgradeneeded = () => {
      const stores = db.result.objectStoreNames
      for (let i = 0; i < stores.length; i++) {
        db.result.deleteObjectStore(stores[i])
      }
    }
    
    // Reload the page to reinitialize the database
    location.reload()
  } catch (err) {
    console.error('Error deleting data:', err)
    alert('Error al eliminar los datos')
  }
}

const requestNotifications = async () => {
  await tasksStore.requestNotificationPermission()
}

const getNotificationStatus = () => {
  if (!('Notification' in window)) {
    return 'not-supported'
  }
  return Notification.permission
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configuración</h1>
    
    <div class="space-y-6">
      <!-- Theme -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Apariencia</h2>
        
        <div class="flex items-center justify-between">
          <span class="text-gray-700 dark:text-gray-300">Tema Oscuro</span>
          <button 
            @click="themeStore.toggleDarkMode()"
            class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors"
            :class="themeStore.isDark ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span 
              class="inline-block w-4 h-4 transform rounded-full bg-white transition-transform"
              :class="themeStore.isDark ? 'translate-x-6' : 'translate-x-1'"
            ></span>
          </button>
        </div>
      </div>
      
      <!-- Notifications -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notificaciones</h2>
        
        <div v-if="getNotificationStatus() === 'not-supported'" class="text-gray-500 dark:text-gray-400">
          Las notificaciones no están soportadas en este navegador.
        </div>
        
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300">Estado</span>
            <span
              class="px-2 py-1 text-xs rounded-full"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': getNotificationStatus() === 'granted',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': getNotificationStatus() === 'default',
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': getNotificationStatus() === 'denied'
              }"
            >
              {{ 
                getNotificationStatus() === 'granted' 
                  ? 'Habilitadas' 
                  : getNotificationStatus() === 'denied'
                    ? 'Bloqueadas'
                    : 'No configuradas'
              }}
            </span>
          </div>
          
          <button
            v-if="getNotificationStatus() !== 'granted'"
            @click="requestNotifications"
            class="btn btn-primary w-full"
            :disabled="getNotificationStatus() === 'denied'"
          >
            {{ getNotificationStatus() === 'denied' ? 'Notificaciones bloqueadas en el navegador' : 'Habilitar Notificaciones' }}
          </button>
          
          <p v-if="getNotificationStatus() === 'denied'" class="text-sm text-gray-500 dark:text-gray-400">
            Para habilitar las notificaciones, debes cambiar la configuración en tu navegador.
          </p>
        </div>
      </div>
      
      <!-- Subjects -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Materias</h2>
        
        <div class="space-y-2">
          <div 
            v-for="subject in subjectsStore.subjects"
            :key="subject.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex items-center">
              <span 
                class="inline-block w-4 h-4 rounded-full mr-3"
                :style="{ backgroundColor: subject.color }"
              ></span>
              <span class="text-gray-900 dark:text-white">{{ subject.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Data Management -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gestión de Datos</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="exportData"
            class="btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 flex items-center justify-center"
            :disabled="exportLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ exportLoading ? 'Exportando...' : 'Exportar Datos' }}
          </button>
          
          <button
            @click="triggerImportDialog"
            class="btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center"
            :disabled="importLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {{ importLoading ? 'Importando...' : 'Importar Datos' }}
          </button>
          
          <input 
            type="file" 
            ref="fileInputRef"
            @change="handleImportFile" 
            accept="application/json"
            class="hidden"
          >
        </div>
        
        <div class="mt-6">
          <button
            @click="showDeleteConfirmation"
            class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 w-full"
          >
            Eliminar Todos los Datos
          </button>
        </div>
      </div>
      
      <!-- About -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acerca de</h2>
        
        <div class="text-gray-700 dark:text-gray-300 space-y-2">
          <p>EstudiaPlan v1.0.0</p>
          <p>Una aplicación para ayudar a los estudiantes a organizar su vida académica.</p>
          <p>© 2025 EstudiaPlan. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div 
      v-if="deleteConfirmation" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmar Eliminación</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-2">
          ¿Estás seguro de que deseas eliminar TODOS tus datos?
        </p>
        <p class="text-red-600 dark:text-red-400 font-medium mb-6">
          Esta acción no se puede deshacer y perderás toda tu información.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="deleteAllData" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar Todo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>