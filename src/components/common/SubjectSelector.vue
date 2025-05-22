<script setup>
import { ref, onMounted } from 'vue'
import { useSubjectsStore } from '../../stores/subjects'

const props = defineProps({
  modelValue: {
    type: Number,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const subjectsStore = useSubjectsStore()
const showAddSubject = ref(false)
const newSubjectName = ref('')
const newSubjectColor = ref('#3b82f6')

onMounted(async () => {
  await subjectsStore.fetchSubjects()
})

const handleSelection = (id) => {
  emit('update:modelValue', id)
}

const addNewSubject = async () => {
  if (newSubjectName.value.trim()) {
    const subject = {
      name: newSubjectName.value.trim(),
      color: newSubjectColor.value
    }
    
    const id = await subjectsStore.addSubject(subject)
    emit('update:modelValue', id)
    
    // Reset form
    newSubjectName.value = ''
    newSubjectColor.value = '#3b82f6'
    showAddSubject.value = false
  }
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Materia
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="mb-4" v-if="!showAddSubject">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="subject in subjectsStore.subjects"
          :key="subject.id"
          @click="handleSelection(subject.id)"
          class="px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors"
          :class="modelValue === subject.id 
            ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'"
        >
          {{ subject.name }}
          <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: subject.color }"></span>
        </button>
      </div>
      
      <button 
        @click="showAddSubject = true" 
        class="mt-2 w-full py-2 px-3 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
      >
        + Añadir nueva materia
      </button>
    </div>
    
    <div v-else class="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-900">
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de la materia
        </label>
        <input 
          type="text" 
          v-model="newSubjectName" 
          placeholder="Ej: Física"
          class="input"
        >
      </div>
      
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color
        </label>
        <input 
          type="color" 
          v-model="newSubjectColor"
          class="w-full h-10 rounded-lg cursor-pointer"
        >
      </div>
      
      <div class="flex space-x-2">
        <button 
          @click="showAddSubject = false" 
          class="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="addNewSubject" 
          class="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          :disabled="!newSubjectName.trim()"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
</template>