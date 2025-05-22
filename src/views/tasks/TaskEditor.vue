<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore } from '../../stores/tasks'
import SubjectSelector from '../../components/common/SubjectSelector.vue'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()

const isNew = computed(() => route.params.id === 'new')
const taskId = computed(() => isNew.value ? null : Number(route.params.id))

const title = ref('')
const description = ref('')
const dueDate = ref('')
const subjectId = ref(null)
const priority = ref('medium')
const status = ref('pending')
const loading = ref(false)
const saving = ref(false)
const deleteConfirmation = ref(false)

onMounted(async () => {
  if (!isNew.value) {
    loading.value = true
    try {
      const task = await tasksStore.getTaskById(taskId.value)
      if (task) {
        title.value = task.title
        description.value = task.description || ''
        dueDate.value = formatDateForInput(task.dueDate)
        subjectId.value = task.subjectId
        priority.value = task.priority || 'medium'
        status.value = task.status || 'pending'
      } else {
        router.push('/tasks')
      }
    } catch (err) {
      console.error('Error loading task:', err)
    } finally {
      loading.value = false
    }
  } else {
    // Set default due date for new task to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    dueDate.value = formatDateForInput(tomorrow.toISOString())
  }
})

const formatDateForInput = (dateString) => {
  return format(new Date(dateString), 'yyyy-MM-dd')
}

const saveTask = async () => {
  if (!title.value.trim()) {
    alert('Por favor ingresa un título para la tarea')
    return
  }
  
  if (!dueDate.value) {
    alert('Por favor selecciona una fecha de vencimiento')
    return
  }
  
  if (!subjectId.value) {
    alert('Por favor selecciona una materia')
    return
  }
  
  saving.value = true
  
  try {
    const taskData = {
      title: title.value.trim(),
      description: description.value.trim(),
      dueDate: new Date(dueDate.value).toISOString(),
      subjectId: subjectId.value,
      priority: priority.value,
      status: status.value
    }
    
    if (isNew.value) {
      await tasksStore.addTask(taskData)
    } else {
      await tasksStore.updateTask(taskId.value, taskData)
    }
    
    router.push('/tasks')
  } catch (err) {
    console.error('Error saving task:', err)
    alert('Error al guardar la tarea')
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  deleteConfirmation.value = true
}

const cancelDelete = () => {
  deleteConfirmation.value = false
}

const deleteTask = async () => {
  try {
    await tasksStore.deleteTask(taskId.value)
    router.push('/tasks')
  } catch (err) {
    console.error('Error deleting task:', err)
    alert('Error al eliminar la tarea')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ isNew ? 'Nueva Tarea' : 'Editar Tarea' }}
      </h1>
      
      <div class="flex space-x-2">
        <button 
          v-if="!isNew" 
          @click="confirmDelete" 
          class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
        >
          Eliminar
        </button>
        <button 
          @click="saveTask" 
          class="btn btn-primary"
          :disabled="saving"
        >
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando tarea...</p>
    </div>
    
    <div v-else class="card">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          v-model="title" 
          placeholder="Título de la tarea" 
          class="input"
        >
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea 
          v-model="description" 
          placeholder="Descripción de la tarea" 
          rows="4"
          class="input"
        ></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de vencimiento <span class="text-red-500">*</span>
          </label>
          <input 
            type="date" 
            v-model="dueDate" 
            class="input"
          >
        </div>
        
        <div>
          <SubjectSelector v-model="subjectId" :required="true" />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridad
          </label>
          <select v-model="priority" class="input">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select v-model="status" class="input">
            <option value="pending">Pendiente</option>
            <option value="in-progress">En Progreso</option>
            <option value="completed">Completada</option>
          </select>
        </div>
      </div>
      
      <div class="text-sm text-gray-500 dark:text-gray-400 mt-4">
        <p v-if="'Notification' in window && Notification.permission === 'granted'">
          Se enviará una notificación un día antes de la fecha de vencimiento.
        </p>
        <p v-else-if="'Notification' in window && Notification.permission !== 'denied'">
          <button 
            @click="tasksStore.requestNotificationPermission" 
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Habilitar notificaciones
          </button> 
          para recibir recordatorios de tareas.
        </p>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div 
      v-if="deleteConfirmation" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmar Eliminación</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="deleteTask" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>