import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database/db'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all tasks
  async function fetchTasks() {
    loading.value = true
    try {
      tasks.value = await db.tasks.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching tasks:', err)
      error.value = 'Error al cargar las tareas'
    } finally {
      loading.value = false
    }
  }
  
  // Get tasks by subject
  async function fetchTasksBySubject(subjectId) {
    loading.value = true
    try {
      tasks.value = await db.tasks
        .where('subjectId')
        .equals(subjectId)
        .toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching tasks by subject:', err)
      error.value = 'Error al cargar las tareas de la materia'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new task
  async function addTask(task) {
    try {
      const timestamp = new Date().toISOString()
      const taskWithTimestamp = {
        ...task,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const id = await db.tasks.add(taskWithTimestamp)
      await fetchTasks()
      
      // Schedule notification if permissions are granted
      if (task.dueDate && 'Notification' in window && Notification.permission === 'granted') {
        const dueDate = new Date(task.dueDate)
        const currentDate = new Date()
        
        // If due date is in the future, schedule notification 1 day before
        if (dueDate > currentDate) {
          const notificationDate = new Date(dueDate)
          notificationDate.setDate(notificationDate.getDate() - 1)
          
          const timeUntilNotification = notificationDate.getTime() - currentDate.getTime()
          
          if (timeUntilNotification > 0) {
            setTimeout(() => {
              new Notification('Recordatorio de tarea', {
                body: `La tarea "${task.title}" vence mañana!`,
                icon: '/estudiaplan/pwa-192x192.png'
              })
            }, timeUntilNotification)
          }
        }
      }
      
      return id
    } catch (err) {
      console.error('Error adding task:', err)
      error.value = 'Error al añadir la tarea'
      throw err
    }
  }
  
  // Update a task
  async function updateTask(id, updatedTask) {
    try {
      const timestamp = new Date().toISOString()
      await db.tasks.update(id, {
        ...updatedTask,
        updatedAt: timestamp
      })
      await fetchTasks()
    } catch (err) {
      console.error('Error updating task:', err)
      error.value = 'Error al actualizar la tarea'
      throw err
    }
  }
  
  // Delete a task
  async function deleteTask(id) {
    try {
      await db.tasks.delete(id)
      await fetchTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
      error.value = 'Error al eliminar la tarea'
      throw err
    }
  }
  
  // Get a task by id
  const getTaskById = computed(() => {
    return async (id) => {
      if (!id) return null
      return await db.tasks.get(Number(id))
    }
  })
  
  // Get upcoming tasks
  async function fetchUpcomingTasks() {
    loading.value = true
    try {
      const allTasks = await db.tasks.toArray()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      tasks.value = allTasks
        .filter(task => {
          const dueDate = new Date(task.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate >= today && task.status !== 'completed'
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      
      error.value = null
    } catch (err) {
      console.error('Error fetching upcoming tasks:', err)
      error.value = 'Error al cargar las tareas próximas'
    } finally {
      loading.value = false
    }
  }
  
  // Request notification permission
  async function requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission()
        return permission
      } catch (err) {
        console.error('Error requesting notification permission:', err)
        return 'denied'
      }
    }
    return 'unsupported'
  }
  
  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksBySubject,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    fetchUpcomingTasks,
    requestNotificationPermission
  }
})