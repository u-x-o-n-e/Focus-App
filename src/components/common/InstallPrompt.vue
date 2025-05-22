<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const deferredPrompt = ref(null)
const showInstallButton = ref(false)

// Listen for the beforeinstallprompt event
const handleBeforeInstallPrompt = (event) => {
  // Prevent the default behavior (prevents automatic prompt)
  event.preventDefault()
  
  // Store the event for later use
  deferredPrompt.value = event
  
  // Show the install button
  showInstallButton.value = true
}

// Function to install the app
const installApp = async () => {
  if (!deferredPrompt.value) return
  
  // Show the installation prompt
  deferredPrompt.value.prompt()
  
  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.value.userChoice
  
  // Reset the deferred prompt variable
  deferredPrompt.value = null
  showInstallButton.value = false
}

// Check if the app is already installed
const checkIfInstalled = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallButton.value = false
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  checkIfInstalled()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <div v-if="showInstallButton" class="fixed bottom-20 md:bottom-4 right-4 z-50">
    <button
      @click="installApp"
      class="bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg shadow-lg px-4 py-3 flex items-center transition-colors duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Descargar App
    </button>
  </div>
</template>