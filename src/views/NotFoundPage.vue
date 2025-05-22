<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <h1 class="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</h1>
    <p class="text-xl text-gray-700 dark:text-gray-300 mb-8">Página no encontrada</p>
    
    <div class="flex space-x-4">
      <button 
        @click="goBack" 
        class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Volver
      </button>
      <button 
        @click="goHome" 
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Ir al Inicio
      </button>
    </div>
  </div>
</template>