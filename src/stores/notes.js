import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database/db'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all notes
  async function fetchNotes() {
    loading.value = true
    try {
      notes.value = await db.notes.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching notes:', err)
      error.value = 'Error al cargar los apuntes'
    } finally {
      loading.value = false
    }
  }
  
  // Get notes by subject
  async function fetchNotesBySubject(subjectId) {
    loading.value = true
    try {
      notes.value = await db.notes
        .where('subjectId')
        .equals(subjectId)
        .toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching notes by subject:', err)
      error.value = 'Error al cargar los apuntes de la materia'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new note
  async function addNote(note) {
    try {
      const timestamp = new Date().toISOString()
      const noteWithTimestamp = {
        ...note,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const id = await db.notes.add(noteWithTimestamp)
      await fetchNotes()
      return id
    } catch (err) {
      console.error('Error adding note:', err)
      error.value = 'Error al añadir el apunte'
      throw err
    }
  }
  
  // Update a note
  async function updateNote(id, updatedNote) {
    try {
      const timestamp = new Date().toISOString()
      await db.notes.update(id, {
        ...updatedNote,
        updatedAt: timestamp
      })
      await fetchNotes()
    } catch (err) {
      console.error('Error updating note:', err)
      error.value = 'Error al actualizar el apunte'
      throw err
    }
  }
  
  // Delete a note
  async function deleteNote(id) {
    try {
      await db.notes.delete(id)
      await fetchNotes()
    } catch (err) {
      console.error('Error deleting note:', err)
      error.value = 'Error al eliminar el apunte'
      throw err
    }
  }
  
  // Get a note by id
  const getNoteById = computed(() => {
    return async (id) => {
      if (!id) return null
      return await db.notes.get(Number(id))
    }
  })
  
  // Search notes
  async function searchNotes(query) {
    loading.value = true
    try {
      const allNotes = await db.notes.toArray()
      const searchQuery = query.toLowerCase()
      notes.value = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery) || 
        note.content.toLowerCase().includes(searchQuery) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
      )
      error.value = null
    } catch (err) {
      console.error('Error searching notes:', err)
      error.value = 'Error al buscar los apuntes'
    } finally {
      loading.value = false
    }
  }
  
  return {
    notes,
    loading,
    error,
    fetchNotes,
    fetchNotesBySubject,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    searchNotes
  }
})