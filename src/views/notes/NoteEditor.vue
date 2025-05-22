<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../../stores/notes'
import SubjectSelector from '../../components/common/SubjectSelector.vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const isNew = computed(() => route.params.id === 'new')
const noteId = computed(() => isNew.value ? null : Number(route.params.id))

const title = ref('')
const content = ref('')
const subjectId = ref(null)
const tags = ref([])
const tagInput = ref('')
const loading = ref(false)
const saving = ref(false)
const deleteConfirmation = ref(false)
const showColorPicker = ref(false)
const selectedColor = ref('#000000')
const selectedFontFamily = ref('Arial')

const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Helvetica'
]

const editor = ref(null)

onMounted(async () => {
  if (!isNew.value) {
    loading.value = true
    try {
      const note = await notesStore.getNoteById(noteId.value)
      if (note) {
        title.value = note.title
        content.value = note.content
        subjectId.value = note.subjectId
        tags.value = note.tags || []
      } else {
        router.push('/notes')
      }
    } catch (err) {
      console.error('Error loading note:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Initialize editor with extended features
  editor.value = new Editor({
    extensions: [
      StarterKit,
      Underline,
      Strike,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color,
    ],
    content: content.value,
    onUpdate: ({ editor }) => {
      content.value = editor.getHTML()
    },
  })
})

// Update editor content if note content changes
watch(content, (newContent) => {
  if (editor.value && editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent)
  }
})

const addTag = () => {
  if (tagInput.value.trim() && !tags.value.includes(tagInput.value.trim())) {
    tags.value.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (index) => {
  tags.value.splice(index, 1)
}

const saveNote = async () => {
  if (!title.value.trim()) {
    alert('Por favor ingresa un título para la nota')
    return
  }
  
  saving.value = true
  
  try {
    const noteData = {
      title: title.value.trim(),
      content: editor.value.getHTML(),
      subjectId: subjectId.value,
      tags: tags.value
    }
    
    if (isNew.value) {
      await notesStore.addNote(noteData)
    } else {
      await notesStore.updateNote(noteId.value, noteData)
    }
    
    router.push('/notes')
  } catch (err) {
    console.error('Error saving note:', err)
    alert('Error al guardar la nota')
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  deleteConfirmation.value = true
}

const cancelDelete = () => {
  deleteConfirmation.value = false
}

const deleteNote = async () => {
  try {
    await notesStore.deleteNote(noteId.value)
    router.push('/notes')
  } catch (err) {
    console.error('Error deleting note:', err)
    alert('Error al eliminar la nota')
  }
}

// Editor methods
const setLink = () => {
  const url = prompt('URL')
  
  if (url) {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  }
}

const addImage = () => {
  const url = prompt('URL de la imagen')
  
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

const setTextAlign = (align) => {
  editor.value.chain().focus().setTextAlign(align).run()
}

const setFontFamily = (family) => {
  selectedFontFamily.value = family
  editor.value.chain().focus().setFontFamily(family).run()
}

const setColor = (color) => {
  selectedColor.value = color
  editor.value.chain().focus().setColor(color).run()
  showColorPicker.value = false
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ isNew ? 'Nueva Nota' : 'Editar Nota' }}
      </h1>
      
      <div class="flex space-x-2">
        <button 
          v-if="!isNew" 
          @click="confirmDelete" 
          class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
        >
          Eliminar
        </button>
        <button 
          @click="saveNote" 
          class="btn btn-primary"
          :disabled="saving"
        >
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Cargando nota...</p>
    </div>
    
    <div v-else class="card">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          v-model="title" 
          placeholder="Título de la nota" 
          class="input"
        >
      </div>
      
      <div class="mb-4">
        <SubjectSelector v-model="subjectId" :required="true" />
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Etiquetas
        </label>
        <div class="flex items-center">
          <input 
            type="text" 
            v-model="tagInput" 
            placeholder="Añadir etiqueta" 
            class="input"
            @keydown.enter.prevent="addTag"
          >
          <button 
            @click="addTag" 
            class="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Añadir
          </button>
        </div>
        
        <div v-if="tags.length > 0" class="mt-2 flex flex-wrap gap-2">
          <div 
            v-for="(tag, index) in tags" 
            :key="index"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          >
            {{ tag }}
            <button 
              @click="removeTag(index)" 
              class="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contenido <span class="text-red-500">*</span>
        </label>
        
        <div class="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
          <!-- Editor Menu -->
          <div class="border-b border-gray-300 dark:border-gray-700 p-2">
            <!-- Text Style Controls -->
            <div class="flex flex-wrap gap-1 mb-2">
              <button
                @click="editor.chain().focus().toggleBold().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('bold') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Negrita"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleItalic().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('italic') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Cursiva"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleUnderline().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('underline') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Subrayado"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleStrike().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('strike') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Tachado"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleSubscript().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('subscript') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Subíndice"
              >
                x₂
              </button>
              
              <button
                @click="editor.chain().focus().toggleSuperscript().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('superscript') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Superíndice"
              >
                x²
              </button>
              
              <!-- Font Family Selector -->
              <select 
                v-model="selectedFontFamily"
                @change="setFontFamily($event.target.value)"
                class="p-2 rounded bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700"
              >
                <option v-for="font in fontFamilies" :key="font" :value="font">
                  {{ font }}
                </option>
              </select>
              
              <!-- Color Picker -->
              <div class="relative">
                <button
                  @click="showColorPicker = !showColorPicker"
                  class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  title="Color de texto"
                >
                  <div class="w-5 h-5 rounded" :style="{ backgroundColor: selectedColor }"></div>
                </button>
                
                <div
                  v-if="showColorPicker"
                  class="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                >
                  <div class="grid grid-cols-5 gap-1">
                    <button
                      v-for="color in ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000', '#008000']"
                      :key="color"
                      @click="setColor(color)"
                      class="w-6 h-6 rounded"
                      :style="{ backgroundColor: color }"
                    ></button>
                  </div>
                  <input
                    type="color"
                    v-model="selectedColor"
                    @change="setColor(selectedColor)"
                    class="mt-2 w-full h-8"
                  >
                </div>
              </div>
            </div>
            
            <!-- Paragraph Style Controls -->
            <div class="flex flex-wrap gap-1">
              <button
                @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('heading', { level: 1 }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Título 1"
              >
                H1
              </button>
              
              <button
                @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('heading', { level: 2 }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Título 2"
              >
                H2
              </button>
              
              <button
                @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('heading', { level: 3 }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Título 3"
              >
                H3
              </button>
              
              <button
                @click="setTextAlign('left')"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive({ textAlign: 'left' }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Alinear a la izquierda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" />
                </svg>
              </button>
              
              <button
                @click="setTextAlign('center')"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive({ textAlign: 'center' }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Centrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M6 12h12M4 18h16" />
                </svg>
              </button>
              
              <button
                @click="setTextAlign('right')"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive({ textAlign: 'right' }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Alinear a la derecha"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" />
                </svg>
              </button>
              
              <button
                @click="setTextAlign('justify')"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive({ textAlign: 'justify' }) }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Justificar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <!-- List Controls -->
            <div class="flex flex-wrap gap-1 mt-2">
              <button
                @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('bulletList') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Lista con viñetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('orderedList') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Lista numerada"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              
              <button
                @click="editor.chain().focus().toggleTaskList().run()"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('taskList') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Lista de tareas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
              
              <button
                @click="setLink"
                :class="{ 'bg-gray-200 dark:bg-gray-700': editor?.isActive('link') }"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Insertar enlace"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              
              <button
                @click="addImage"
                class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Insertar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Editor Content -->
          <div class="p-4 min-h-[300px] prose dark:prose-invert max-w-none">
            <EditorContent :editor="editor" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div 
      v-if="deleteConfirmation" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmar Eliminación</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar esta nota? Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="deleteNote" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.ProseMirror {
  min-height: 300px;
  outline: none;
}

.ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}

.ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5em;
}

.ProseMirror ul[data-type="taskList"] li > label {
  margin-right: 0.5em;
  user-select: none;
}

.ProseMirror ul[data-type="taskList"] li > div {
  flex: 1;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>