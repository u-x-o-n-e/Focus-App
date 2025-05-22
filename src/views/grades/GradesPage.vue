<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGradesStore } from '../../stores/grades'
import { useSubjectsStore } from '../../stores/subjects'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const gradesStore = useGradesStore()
const subjectsStore = useSubjectsStore()

const selectedSubjectId = ref(null)
const newGrade = ref({
  title: '',
  score: null,
  maxScore: 100,
  weight: 1,
  date: format(new Date(), 'yyyy-MM-dd'),
  subjectId: null
})
const showAddGradeForm = ref(false)
const editingGradeId = ref(null)

onMounted(async () => {
  await subjectsStore.fetchSubjects()
  await gradesStore.fetchGrades()
})

const gradesBySubject = computed(() => {
  const grouped = {}
  
  // Group grades by subject
  subjectsStore.subjects.forEach(subject => {
    const subjectGrades = gradesStore.grades.filter(grade => grade.subjectId === subject.id)
    
    if (subjectGrades.length > 0 || !selectedSubjectId.value || selectedSubjectId.value === subject.id) {
      grouped[subject.id] = {
        subject,
        grades: subjectGrades.sort((a, b) => new Date(b.date) - new Date(a.date)),
        average: gradesStore.calculateSubjectAverage(subject.id)
      }
    }
  })
  
  // Filter by selected subject if any
  if (selectedSubjectId.value) {
    const filtered = {}
    if (grouped[selectedSubjectId.value]) {
      filtered[selectedSubjectId.value] = grouped[selectedSubjectId.value]
    }
    return filtered
  }
  
  return grouped
})

const formatDate = (dateString) => {
  return format(new Date(dateString), 'd MMM, yyyy', { locale: es })
}

const formatPercentage = (value) => {
  return value.toFixed(1) + '%'
}

const getGradeLetter = (percentage) => {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

const openAddGradeForm = (subjectId) => {
  newGrade.value = {
    title: '',
    score: null,
    maxScore: 100,
    weight: 1,
    date: format(new Date(), 'yyyy-MM-dd'),
    subjectId: subjectId
  }
  showAddGradeForm.value = true
  editingGradeId.value = null
}

const closeForm = () => {
  showAddGradeForm.value = false
  editingGradeId.value = null
}

const editGrade = async (gradeId) => {
  const grade = gradesStore.grades.find(g => g.id === gradeId)
  if (grade) {
    newGrade.value = {
      ...grade,
      date: format(new Date(grade.date), 'yyyy-MM-dd')
    }
    showAddGradeForm.value = true
    editingGradeId.value = gradeId
  }
}

const saveGrade = async () => {
  try {
    if (!newGrade.value.title.trim()) {
      alert('Por favor ingresa un título para la calificación')
      return
    }
    
    if (newGrade.value.score === null || isNaN(newGrade.value.score)) {
      alert('Por favor ingresa una calificación válida')
      return
    }
    
    if (newGrade.value.maxScore <= 0) {
      alert('La calificación máxima debe ser mayor a 0')
      return
    }
    
    const gradeData = {
      ...newGrade.value,
      score: Number(newGrade.value.score),
      maxScore: Number(newGrade.value.maxScore),
      weight: Number(newGrade.value.weight),
      date: new Date(newGrade.value.date).toISOString()
    }
    
    if (editingGradeId.value) {
      await gradesStore.updateGrade(editingGradeId.value, gradeData)
    } else {
      await gradesStore.addGrade(gradeData)
    }
    
    closeForm()
  } catch (err) {
    console.error('Error saving grade:', err)
    alert('Error al guardar la calificación')
  }
}

const deleteGrade = async (gradeId) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta calificación?')) {
    try {
      await gradesStore.deleteGrade(gradeId)
    } catch (err) {
      console.error('Error deleting grade:', err)
      alert('Error al eliminar la calificación')
    }
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Calificaciones</h1>
      
      <div class="flex items-center gap-2">
        <select 
          v-model="selectedSubjectId" 
          class="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option :value="null">Todas las materias</option>
          <option 
            v-for="subject in subjectsStore.subjects"
            :key="subject.id"
            :value="subject.id"
          >
            {{ subject.name }}
          </option>
        </select>
        
        <button
          @click="openAddGradeForm(selectedSubjectId)"
          class="btn btn-primary flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Calificación
        </button>
      </div>
    </div>
    
    <div v-if="gradesStore.loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando calificaciones...</p>
    </div>
    
    <div v-else-if="Object.keys(gradesBySubject).length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No hay calificaciones registradas</p>
      <button
        @click="openAddGradeForm(null)"
        class="mt-4 btn btn-primary"
      >
        Añadir primera calificación
      </button>
    </div>
    
    <div v-else class="space-y-6">
      <div
        v-for="(data, subjectId) in gradesBySubject"
        :key="subjectId"
        class="card"
      >
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div class="flex items-center">
            <span 
              class="inline-block w-4 h-4 rounded-full mr-2"
              :style="{ backgroundColor: data.subject.color }"
            ></span>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ data.subject.name }}
            </h2>
          </div>
          
          <div class="mt-2 md:mt-0 flex items-center">
            <div class="text-lg font-semibold mr-3">
              Promedio: 
              <span :class="data.average >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ formatPercentage(data.average) }} ({{ getGradeLetter(data.average) }})
              </span>
            </div>
            
            <button
              @click="openAddGradeForm(Number(subjectId))"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Título</th>
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Calificación</th>
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Porcentaje</th>
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Peso</th>
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Fecha</th>
                <th class="py-2 px-4 text-gray-600 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="grade in data.grades" 
                :key="grade.id"
                class="border-b border-gray-100 dark:border-gray-800"
              >
                <td class="py-3 px-4 text-gray-900 dark:text-white">{{ grade.title }}</td>
                <td class="py-3 px-4 text-gray-900 dark:text-white">{{ grade.score }}/{{ grade.maxScore }}</td>
                <td class="py-3 px-4">
                  <span 
                    :class="(grade.score / grade.maxScore) * 100 >= 70 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'"
                  >
                    {{ formatPercentage((grade.score / grade.maxScore) * 100) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-900 dark:text-white">{{ grade.weight }}</td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">{{ formatDate(grade.date) }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="editGrade(grade.id)"
                      class="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteGrade(grade.id)"
                      class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Grade Form Modal -->
    <div 
      v-if="showAddGradeForm" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ editingGradeId ? 'Editar Calificación' : 'Nueva Calificación' }}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              v-model="newGrade.title" 
              placeholder="Ej: Examen Parcial" 
              class="input"
            >
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Calificación <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                v-model.number="newGrade.score" 
                min="0" 
                :max="newGrade.maxScore"
                class="input"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Máximo <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                v-model.number="newGrade.maxScore" 
                min="1"
                class="input"
              >
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso
              </label>
              <input 
                type="number" 
                v-model.number="newGrade.weight" 
                min="0.1" 
                step="0.1"
                class="input"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha
              </label>
              <input 
                type="date" 
                v-model="newGrade.date" 
                class="input"
              >
            </div>
          </div>
          
          <div v-if="!editingGradeId">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Materia <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="newGrade.subjectId" 
              class="input"
              :required="true"
            >
              <option v-if="!newGrade.subjectId" :value="null" disabled>Selecciona una materia</option>
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
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeForm" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveGrade" 
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>