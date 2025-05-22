import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database/db'

export const useGradesStore = defineStore('grades', () => {
  const grades = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all grades
  async function fetchGrades() {
    loading.value = true
    try {
      grades.value = await db.grades.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching grades:', err)
      error.value = 'Error al cargar las calificaciones'
    } finally {
      loading.value = false
    }
  }
  
  // Get grades by subject
  async function fetchGradesBySubject(subjectId) {
    loading.value = true
    try {
      grades.value = await db.grades
        .where('subjectId')
        .equals(subjectId)
        .toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching grades by subject:', err)
      error.value = 'Error al cargar las calificaciones de la materia'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new grade
  async function addGrade(grade) {
    try {
      const timestamp = new Date().toISOString()
      const gradeWithTimestamp = {
        ...grade,
        createdAt: timestamp
      }
      const id = await db.grades.add(gradeWithTimestamp)
      await fetchGrades()
      return id
    } catch (err) {
      console.error('Error adding grade:', err)
      error.value = 'Error al añadir la calificación'
      throw err
    }
  }
  
  // Update a grade
  async function updateGrade(id, updatedGrade) {
    try {
      await db.grades.update(id, updatedGrade)
      await fetchGrades()
    } catch (err) {
      console.error('Error updating grade:', err)
      error.value = 'Error al actualizar la calificación'
      throw err
    }
  }
  
  // Delete a grade
  async function deleteGrade(id) {
    try {
      await db.grades.delete(id)
      await fetchGrades()
    } catch (err) {
      console.error('Error deleting grade:', err)
      error.value = 'Error al eliminar la calificación'
      throw err
    }
  }
  
  // Calculate subject average
  const calculateSubjectAverage = computed(() => {
    return (subjectId) => {
      const subjectGrades = grades.value.filter(grade => grade.subjectId === subjectId)
      
      if (subjectGrades.length === 0) return 0
      
      // If weights are provided, use weighted average
      const hasWeights = subjectGrades.every(grade => grade.weight !== undefined && grade.weight !== null)
      
      if (hasWeights) {
        const totalWeight = subjectGrades.reduce((sum, grade) => sum + (grade.weight || 0), 0)
        const weightedSum = subjectGrades.reduce((sum, grade) => {
          const percentage = grade.score / grade.maxScore
          return sum + (percentage * (grade.weight || 0))
        }, 0)
        
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0
      } else {
        // Use simple average
        const sum = subjectGrades.reduce((acc, grade) => {
          return acc + (grade.score / grade.maxScore)
        }, 0)
        
        return (sum / subjectGrades.length) * 100
      }
    }
  })
  
  return {
    grades,
    loading,
    error,
    fetchGrades,
    fetchGradesBySubject,
    addGrade,
    updateGrade,
    deleteGrade,
    calculateSubjectAverage
  }
})