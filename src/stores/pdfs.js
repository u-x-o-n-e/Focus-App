import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database/db'

export const usePdfsStore = defineStore('pdfs', () => {
  const pdfs = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get all pdfs
  async function fetchPdfs() {
    loading.value = true
    try {
      pdfs.value = await db.pdfs.toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching PDFs:', err)
      error.value = 'Error al cargar los PDFs'
    } finally {
      loading.value = false
    }
  }
  
  // Get pdfs by subject
  async function fetchPdfsBySubject(subjectId) {
    loading.value = true
    try {
      pdfs.value = await db.pdfs
        .where('subjectId')
        .equals(subjectId)
        .toArray()
      error.value = null
    } catch (err) {
      console.error('Error fetching PDFs by subject:', err)
      error.value = 'Error al cargar los PDFs de la materia'
    } finally {
      loading.value = false
    }
  }
  
  // Add a new pdf
  async function addPdf(pdf, file) {
    try {
      const timestamp = new Date().toISOString()
      
      // Convert File to ArrayBuffer
      const fileBuffer = await file.arrayBuffer()
      
      const pdfWithData = {
        ...pdf,
        file: fileBuffer,
        size: file.size,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      
      const id = await db.pdfs.add(pdfWithData)
      await fetchPdfs()
      return id
    } catch (err) {
      console.error('Error adding PDF:', err)
      error.value = 'Error al añadir el PDF'
      throw err
    }
  }
  
  // Update a pdf
  async function updatePdf(id, updatedPdf, file) {
    try {
      const timestamp = new Date().toISOString()
      const currentPdf = await db.pdfs.get(id)
      
      let updatedData = {
        ...updatedPdf,
        updatedAt: timestamp
      }
      
      // If new file is provided, update the file data
      if (file) {
        const fileBuffer = await file.arrayBuffer()
        updatedData = {
          ...updatedData,
          file: fileBuffer,
          size: file.size
        }
      }
      
      await db.pdfs.update(id, updatedData)
      await fetchPdfs()
    } catch (err) {
      console.error('Error updating PDF:', err)
      error.value = 'Error al actualizar el PDF'
      throw err
    }
  }
  
  // Delete a pdf
  async function deletePdf(id) {
    try {
      await db.pdfs.delete(id)
      await fetchPdfs()
    } catch (err) {
      console.error('Error deleting PDF:', err)
      error.value = 'Error al eliminar el PDF'
      throw err
    }
  }
  
  // Get a pdf by id
  const getPdfById = computed(() => {
    return async (id) => {
      if (!id) return null
      return await db.pdfs.get(Number(id))
    }
  })
  
  // Search PDFs
  async function searchPdfs(query) {
    loading.value = true
    try {
      const allPdfs = await db.pdfs.toArray()
      const searchQuery = query.toLowerCase()
      pdfs.value = allPdfs.filter(pdf => 
        pdf.title.toLowerCase().includes(searchQuery)
      )
      error.value = null
    } catch (err) {
      console.error('Error searching PDFs:', err)
      error.value = 'Error al buscar los PDFs'
    } finally {
      loading.value = false
    }
  }
  
  return {
    pdfs,
    loading,
    error,
    fetchPdfs,
    fetchPdfsBySubject,
    addPdf,
    updatePdf,
    deletePdf,
    getPdfById,
    searchPdfs
  }
})