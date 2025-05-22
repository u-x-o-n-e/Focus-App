import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '../database/db'

export const usePlannerStore = defineStore('planner', () => {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all events
  async function fetchEvents() {
    loading.value = true
    try {
      events.value = await db.planner.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching events:', err)
      error.value = 'Error al cargar los eventos'
    } finally {
      loading.value = false
    }
  }
  
  // Get events by day
  async function fetchEventsByDay(day) {
    loading.value = true
    try {
      events.value = await db.planner
        .where('day')
        .equals(day)
        .toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching events by day:', err)
      error.value = 'Error al cargar los eventos del día'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new event
  async function addEvent(event) {
    try {
      const timestamp = new Date().toISOString()
      const eventWithTimestamp = {
        ...event,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const id = await db.planner.add(eventWithTimestamp)
      await fetchEvents()
      return id
    } catch (err) {
      console.error('Error adding event:', err)
      error.value = 'Error al añadir el evento'
      throw err
    }
  }
  
  // Update an event
  async function updateEvent(id, updatedEvent) {
    try {
      const timestamp = new Date().toISOString()
      await db.planner.update(id, {
        ...updatedEvent,
        updatedAt: timestamp
      })
      await fetchEvents()
    } catch (err) {
      console.error('Error updating event:', err)
      error.value = 'Error al actualizar el evento'
      throw err
    }
  }
  
  // Delete an event
  async function deleteEvent(id) {
    try {
      await db.planner.delete(id)
      await fetchEvents()
    } catch (err) {
      console.error('Error deleting event:', err)
      error.value = 'Error al eliminar el evento'
      throw err
    }
  }
  
  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchEventsByDay,
    addEvent,
    updateEvent,
    deleteEvent
  }
})