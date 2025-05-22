import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database/db'

export const useSubjectsStore = defineStore('subjects', () => {
  const subjects = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all subjects
  async function fetchSubjects() {
    loading.value = true
    try {
      subjects.value = await db.subjects.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching subjects:', err)
      error.value = 'Error al cargar las materias'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new subject
  async function addSubject(subject) {
    try {
      const id = await db.subjects.add(subject)
      await fetchSubjects()
      return id
    } catch (err) {
      console.error('Error adding subject:', err)
      error.value = 'Error al añadir la materia'
      throw err
    }
  }
  
  // Update a subject
  async function updateSubject(id, updatedSubject) {
    try {
      await db.subjects.update(id, updatedSubject)
      await fetchSubjects()
    } catch (err) {
      console.error('Error updating subject:', err)
      error.value = 'Error al actualizar la materia'
      throw err
    }
  }
  
  // Delete a subject
  async function deleteSubject(id) {
    try {
      await db.subjects.delete(id)
      await fetchSubjects()
    } catch (err) {
      console.error('Error deleting subject:', err)
      error.value = 'Error al eliminar la materia'
      throw err
    }
  }
  
  // Get a subject by id
  const getSubjectById = computed(() => {
    return (id) => subjects.value.find(subject => subject.id === id)
  })
  
  return {
    subjects,
    loading,
    error,
    fetchSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectById
  }
})