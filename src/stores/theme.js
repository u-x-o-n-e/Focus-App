import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')
  
  function setDarkMode(value) {
    isDark.value = value
    localStorage.setItem('theme', value ? 'dark' : 'light')
  }
  
  function toggleDarkMode() {
    setDarkMode(!isDark.value)
  }
  
  return {
    isDark,
    setDarkMode,
    toggleDarkMode
  }
})