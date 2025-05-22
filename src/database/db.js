import Dexie from 'dexie'

// Database definition
const db = new Dexie('EstudiaPlan')

db.version(1).stores({
  subjects: '++id, name, color',
  notes: '++id, title, content, subjectId, tags, createdAt, updatedAt',
  tasks: '++id, title, description, dueDate, status, priority, subjectId, createdAt, updatedAt',
  planner: '++id, title, description, startTime, endTime, day, subjectId, createdAt, updatedAt',
  grades: '++id, title, score, maxScore, weight, subjectId, date, createdAt',
  pdfs: '++id, title, file, size, subjectId, createdAt, updatedAt'
})

// Default data initialization
db.on('populate', async () => {
  // Add default subjects
  await db.subjects.bulkAdd([
    { name: 'Matemáticas', color: '#ef4444' },
    { name: 'Ciencias', color: '#3b82f6' },
    { name: 'Historia', color: '#f59e0b' },
    { name: 'Literatura', color: '#10b981' },
    { name: 'Inglés', color: '#8b5cf6' }
  ])
})

export default db