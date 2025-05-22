<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePlannerStore } from '../../stores/planner'
import { useSubjectsStore } from '../../stores/subjects'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import draggable from 'vuedraggable'

const plannerStore = usePlannerStore()
const subjectsStore = useSubjectsStore()

const days = [
  { name: 'Lunes', value: 'lunes' },
  { name: 'Martes', value: 'martes' },
  { name: 'Miércoles', value: 'miércoles' },
  { name: 'Jueves', value: 'jueves' },
  { name: 'Viernes', value: 'viernes' },
  { name: 'Sábado', value: 'sábado' },
  { name: 'Domingo', value: 'domingo' }
]

const selectedDay = ref(getCurrentDay())
const hours = generateHours()
const showEventForm = ref(false)
const editingEventId = ref(null)
const newEvent = ref({
  title: '',
  description: '',
  startTime: '08:00',
  endTime: '09:00',
  day: getCurrentDay(),
  subjectId: null
})

// Generate hours from 7:00 to 22:00
function generateHours() {
  const hours = []
  for (let i = 7; i <= 22; i++) {
    const hour = i.toString().padStart(2, '0') + ':00'
    hours.push(hour)
  }
  return hours
}

// Get current day of the week
function getCurrentDay() {
  const dayIndex = new Date().getDay()
  // getDay returns 0 for Sunday, so we map it to our array
  const dayMap = [6, 0, 1, 2, 3, 4, 5] // Maps JS day index to our array index
  return days[dayMap[dayIndex]].value
}

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await plannerStore.fetchEvents()
})

const eventsByDay = computed(() => {
  const events = plannerStore.events.filter(event => event.day === selectedDay.value)
  
  // Sort by start time
  return events.sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })
})

const eventsByHour = computed(() => {
  const grouped = {}
  
  hours.forEach(hour => {
    grouped[hour] = []
  })
  
  eventsByDay.value.forEach(event => {
    const startHour = event.startTime.substring(0, 5)
    
    // Find closest hour (round down)
    const closestHour = hours.find(h => h <= startHour) || hours[0]
    
    if (grouped[closestHour]) {
      grouped[closestHour].push(event)
    }
  })
  
  return grouped
})

const getSubjectById = (id) => {
  return subjectsStore.subjects.find(subject => subject.id === id) || { name: 'Sin materia', color: '#94a3b8' }
}

const openAddEventForm = () => {
  newEvent.value = {
    title: '',
    description: '',
    startTime: '08:00',
    endTime: '09:00',
    day: selectedDay.value,
    subjectId: null
  }
  showEventForm.value = true
  editingEventId.value = null
}

const openEditEventForm = (event) => {
  newEvent.value = { ...event }
  showEventForm.value = true
  editingEventId.value = event.id
}

const closeForm = () => {
  showEventForm.value = false
  editingEventId.value = null
}

const saveEvent = async () => {
  try {
    if (!newEvent.value.title.trim()) {
      alert('Por favor ingresa un título para el evento')
      return
    }
    
    if (!newEvent.value.subjectId) {
      alert('Por favor selecciona una materia')
      return
    }
    
    if (newEvent.value.startTime >= newEvent.value.endTime) {
      alert('La hora de inicio debe ser anterior a la hora de fin')
      return
    }
    
    const eventData = {
      ...newEvent.value,
      title: newEvent.value.title.trim(),
      description: newEvent.value.description.trim()
    }
    
    if (editingEventId.value) {
      await plannerStore.updateEvent(editingEventId.value, eventData)
    } else {
      await plannerStore.addEvent(eventData)
    }
    
    closeForm()
  } catch (err) {
    console.error('Error saving event:', err)
    alert('Error al guardar el evento')
  }
}

const deleteEvent = async (eventId) => {
  if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
    try {
      await plannerStore.deleteEvent(eventId)
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Error al eliminar el evento')
    }
  }
}

const getEventHeight = (event) => {
  // Calculate height based on duration
  const start = convertTimeToMinutes(event.startTime)
  const end = convertTimeToMinutes(event.endTime)
  const duration = end - start
  
  // Each minute is 1px in height
  return `${duration}px`
}

const getEventTop = (event) => {
  // Calculate top position based on start time
  const hourStart = convertTimeToMinutes('07:00') // First hour in the grid
  const eventStart = convertTimeToMinutes(event.startTime)
  const offset = eventStart - hourStart
  
  // Each minute is 1px from top
  return `${offset}px`
}

const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const handleDragEnd = async ({ oldIndex, newIndex, moved }) => {
  if (moved && oldIndex !== newIndex) {
    try {
      // Implement logic to update the order or position of events
      console.log('Event moved:', moved)
      
      // Here you would typically update the event's position or time
      // For now, just log it
    } catch (err) {
      console.error('Error updating event order:', err)
    }
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Planificador de Estudio</h1>
      
      <button
        @click="openAddEventForm"
        class="btn btn-primary flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Evento
      </button>
    </div>
    
    <!-- Day Selector -->
    <div class="mb-6 flex overflow-x-auto pb-2">
      <button
        v-for="day in days"
        :key="day.value"
        @click="selectedDay = day.value"
        class="px-4 py-2 mx-1 rounded-lg text-center min-w-[100px] whitespace-nowrap transition-colors"
        :class="selectedDay === day.value 
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'"
      >
        {{ day.name }}
      </button>
    </div>
    
    <div v-if="plannerStore.loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando horario...</p>
    </div>
    
    <div v-else class="card relative overflow-hidden">
      <!-- Timeline View -->
      <div class="relative min-h-[900px]">
        <!-- Hours -->
        <div class="absolute top-0 left-0 w-20 h-full border-r border-gray-200 dark:border-gray-700">
          <div 
            v-for="hour in hours" 
            :key="hour"
            class="h-[60px] flex items-start px-2 pt-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700"
          >
            {{ hour }}
          </div>
        </div>
        
        <!-- Events Area -->
        <div class="ml-20 relative">
          <!-- Hour Grid Lines -->
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-[60px] border-t border-gray-200 dark:border-gray-700"
          ></div>
          
          <!-- Events -->
          <div class="absolute top-0 left-0 w-full h-full p-2">
            <div 
              v-for="event in eventsByDay" 
              :key="event.id"
              class="absolute p-2 rounded-lg w-[calc(100%-16px)] cursor-pointer transition-all hover:shadow-md"
              :style="{
                top: getEventTop(event),
                height: getEventHeight(event),
                backgroundColor: getSubjectById(event.subjectId).color + '20',
                borderLeft: `4px solid ${getSubjectById(event.subjectId).color}`
              }"
              @click="openEditEventForm(event)"
            >
              <div class="flex justify-between items-start h-full">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white text-sm">{{ event.title }}</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {{ event.startTime.substring(0, 5) }} - {{ event.endTime.substring(0, 5) }}
                  </p>
                  <p v-if="event.description" class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {{ event.description }}
                  </p>
                </div>
                
                <button
                  @click.stop="deleteEvent(event.id)"
                  class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Event Form Modal -->
    <div 
      v-if="showEventForm" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ editingEventId ? 'Editar Evento' : 'Nuevo Evento' }}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              v-model="newEvent.title" 
              placeholder="Ej: Clase de Matemáticas" 
              class="input"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea 
              v-model="newEvent.description" 
              placeholder="Descripción o notas adicionales" 
              rows="2"
              class="input"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora de inicio <span class="text-red-500">*</span>
              </label>
              <input 
                type="time" 
                v-model="newEvent.startTime" 
                class="input"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora de fin <span class="text-red-500">*</span>
              </label>
              <input 
                type="time" 
                v-model="newEvent.endTime" 
                class="input"
              >
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Día <span class="text-red-500">*</span>
              </label>
              <select v-model="newEvent.day" class="input">
                <option v-for="day in days" :key="day.value" :value="day.value">
                  {{ day.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Materia <span class="text-red-500">*</span>
              </label>
              <select 
                v-model="newEvent.subjectId" 
                class="input"
                :required="true"
              >
                <option v-if="!newEvent.subjectId" :value="null" disabled>Selecciona una materia</option>
                <option 
                  v-for="subject in subjectsStore.subjects"
                  :key="subject.id"
                  :value="subject.id"
                >
                  {{ subject.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeForm" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveEvent" 
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>