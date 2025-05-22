<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme'

const route = useRoute()
const themeStore = useThemeStore()

const activeRoute = computed(() => route.name)
</script>

<template>
  <nav class="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 py-2 w-full">
    <div class="max-w-lg mx-auto px-4">
      <div class="flex justify-around items-center">
        <router-link 
          to="/" 
          class="flex flex-col items-center py-1 px-3 text-sm rounded-lg transition-colors"
          :class="activeRoute === 'home' 
            ? 'text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Inicio</span>
        </router-link>
        
        <router-link 
          to="/notes" 
          class="flex flex-col items-center py-1 px-3 text-sm rounded-lg transition-colors"
          :class="activeRoute === 'notes' 
            ? 'text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Apuntes</span>
        </router-link>
        
        <router-link 
          to="/tasks" 
          class="flex flex-col items-center py-1 px-3 text-sm rounded-lg transition-colors"
          :class="activeRoute === 'tasks' 
            ? 'text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Tareas</span>
        </router-link>
        
        <router-link 
          to="/planner" 
          class="flex flex-col items-center py-1 px-3 text-sm rounded-lg transition-colors"
          :class="activeRoute === 'planner' 
            ? 'text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Planner</span>
        </router-link>
        
        <router-link 
          to="/settings" 
          class="flex flex-col items-center py-1 px-3 text-sm rounded-lg transition-colors md:hidden"
          :class="activeRoute === 'settings' 
            ? 'text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Ajustes</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>