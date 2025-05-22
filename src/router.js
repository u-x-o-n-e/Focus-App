import { createRouter, createWebHistory } from 'vue-router'

// Import views
import HomePage from './views/HomePage.vue'
import NotesPage from './views/notes/NotesPage.vue'
import NoteEditor from './views/notes/NoteEditor.vue'
import TasksPage from './views/tasks/TasksPage.vue'
import TaskEditor from './views/tasks/TaskEditor.vue'
import PlannerPage from './views/planner/PlannerPage.vue'
import GradesPage from './views/grades/GradesPage.vue'
import PdfsPage from './views/pdfs/PdfsPage.vue'
import PdfViewer from './views/pdfs/PdfViewer.vue'
import SettingsPage from './views/SettingsPage.vue'
import NotFoundPage from './views/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/notes',
    name: 'notes',
    component: NotesPage
  },
  {
    path: '/notes/:id',
    name: 'note-editor',
    component: NoteEditor,
    props: true
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: TasksPage
  },
  {
    path: '/tasks/:id',
    name: 'task-editor',
    component: TaskEditor,
    props: true
  },
  {
    path: '/planner',
    name: 'planner',
    component: PlannerPage
  },
  {
    path: '/grades',
    name: 'grades',
    component: GradesPage
  },
  {
    path: '/pdfs',
    name: 'pdfs',
    component: PdfsPage
  },
  {
    path: '/pdfs/:id',
    name: 'pdf-viewer',
    component: PdfViewer,
    props: true
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage
  }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})