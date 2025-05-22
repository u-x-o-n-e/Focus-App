<script setup>
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme'
import TheNavigation from './components/layout/TheNavigation.vue'
import TheSidebar from './components/layout/TheSidebar.vue'
import InstallPrompt from './components/common/InstallPrompt.vue'

const route = useRoute()
const themeStore = useThemeStore()

const pageTitle = computed(() => {
  const routeMap = {
    'home': 'Dashboard',
    'notes': 'Apuntes',
    'tasks': 'Tareas',
    'planner': 'Planificador',
    'grades': 'Calificaciones',
    'pdfs': 'Documentos',
    'settings': 'Configuración'
  }
  return routeMap[route.name] || 'EstudiaPlan'
})

// Watch for theme changes
watch(() => themeStore.isDark, (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

// Check system preference on mount
onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    themeStore.setDarkMode(true)
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row transition-colors duration-300">
    <!-- Sidebar for desktop -->
    <TheSidebar class="hidden md:flex" />
    
    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <header class="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
          <div class="flex items-center space-x-2">
            <button 
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              @click="themeStore.toggleDarkMode()"
            >
              <span v-if="themeStore.isDark" class="i-heroicons-sun-20-solid text-white w-5 h-5"></span>
              <span v-else class="i-heroicons-moon-20-solid text-gray-700 w-5 h-5"></span>
            </button>
          </div>
        </div>
      </header>
      
      <main class="flex-1 overflow-auto p-4">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      
      <!-- Bottom navigation for mobile -->
      <TheNavigation class="md:hidden" />
    </div>
    
    <!-- Install PWA prompt -->
    <InstallPrompt />
  </div>
</template>